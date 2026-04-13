from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import RegisterSerializer, UserSerializer, ChangePasswordSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data.get('username'))
            response.data['user'] = UserSerializer(user).data
        return response

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh = RefreshToken(request.data['refresh'])
            refresh.blacklist()
            return Response({'detail': 'Выход выполнен'})
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Неверный пароль'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Пароль изменён'})


def _to_min(h: int, m: int) -> int:
    return int(h) * 60 + int(m)


def _task_overlap(a_start: int, a_end: int, b_start: int, b_end: int) -> bool:
    return a_start < b_end and a_end > b_start


class ExportUserDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Imports here to avoid app import side-effects at module load time.
        from apps.twelve_weeks.models import Goal, Task, AchievementDiaryEntry
        from apps.progress.models import ProgressCategory, ProgressTracker, ProgressRecord, StrengthRecord
        from apps.life_wheel.models import WheelSegment, WheelTask

        user = request.user

        goals = list(Goal.objects.filter(user=user).order_by('created_at'))
        goal_key_by_id = {g.id: f"g{idx+1}" for idx, g in enumerate(goals)}

        tasks = list(Task.objects.filter(user=user).order_by('week', 'day_of_week', 'start_hour', 'start_minute', 'id'))

        categories = list(ProgressCategory.objects.filter(user=user).order_by('id'))
        cat_key_by_id = {c.id: f"c{idx+1}" for idx, c in enumerate(categories)}

        trackers = list(ProgressTracker.objects.filter(user=user).order_by('order', 'id'))
        tracker_key_by_id = {t.id: f"t{idx+1}" for idx, t in enumerate(trackers)}

        segments = list(WheelSegment.objects.filter(user=user).order_by('order', 'id'))
        seg_key_by_id = {s.id: f"s{idx+1}" for idx, s in enumerate(segments)}

        payload = {
            "format": "productivityMax-export",
            "version": 1,
            "exported_at": timezone.now().isoformat(),
            "user": {"username": user.username},
            "twelve_weeks": {
                "goals": [
                    {
                        "key": goal_key_by_id[g.id],
                        "text": g.text,
                        "done": bool(g.done),
                        "created_at": g.created_at.isoformat() if g.created_at else None,
                    }
                    for g in goals
                ],
                "tasks": [
                    {
                        "text": t.text,
                        "done": bool(t.done),
                        "type": t.type,
                        "week": int(t.week),
                        "day_of_week": int(t.day_of_week),
                        "goal_key": goal_key_by_id.get(t.goal_id) if t.goal_id else None,
                        "start_hour": t.start_hour,
                        "start_minute": t.start_minute,
                        "end_hour": t.end_hour,
                        "end_minute": t.end_minute,
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    }
                    for t in tasks
                ],
            },
            "diary": [
                {
                    "type": e.type,
                    "week": int(e.week),
                    "day_of_week": e.day_of_week,
                    "text": e.text,
                    "icon_key": e.icon_key,
                    "date": e.date.isoformat() if e.date else None,
                }
                for e in AchievementDiaryEntry.objects.filter(user=user).order_by('-date', '-id')
            ],
            "progress": {
                "categories": [
                    {"key": cat_key_by_id[c.id], "name": c.name, "color": c.color}
                    for c in categories
                ],
                "trackers": [
                    {
                        "key": tracker_key_by_id[t.id],
                        "category_key": cat_key_by_id.get(t.category_id) if t.category_id else None,
                        "name": t.name,
                        "kind": t.kind,
                        "unit": t.unit,
                        "color": t.color,
                        "order": int(t.order),
                        "records": [
                            {"value": r.value, "note": r.note, "date": r.date.isoformat() if r.date else None}
                            for r in ProgressRecord.objects.filter(tracker=t).order_by('date', 'id')
                        ],
                        "strength_records": [
                            {
                                "weight": r.weight,
                                "reps": int(r.reps),
                                "orm": r.orm,
                                "note": r.note,
                                "date": r.date.isoformat() if r.date else None,
                            }
                            for r in StrengthRecord.objects.filter(tracker=t).order_by('date', 'id')
                        ],
                    }
                    for t in trackers
                ],
            },
            "life_wheel": {
                "segments": [
                    {
                        "key": seg_key_by_id[s.id],
                        "name": s.name,
                        "score": int(s.score),
                        "color": s.color,
                        "order": int(s.order),
                        "tasks": [
                            {"text": wt.text, "done": bool(wt.done)}
                            for wt in WheelTask.objects.filter(segment=s).order_by('id')
                        ],
                    }
                    for s in segments
                ]
            },
        }
        return Response(payload)


class ImportUserDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.twelve_weeks.models import Goal, Task, AchievementDiaryEntry
        from apps.progress.models import ProgressCategory, ProgressTracker, ProgressRecord, StrengthRecord
        from apps.life_wheel.models import WheelSegment, WheelTask

        data = request.data if isinstance(request.data, dict) else {}
        if data.get("format") != "productivityMax-export":
            return Response({"detail": "Неверный формат файла"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        created = {
            "goals": 0,
            "tasks": 0,
            "diary": 0,
            "progress_categories": 0,
            "progress_trackers": 0,
            "progress_records": 0,
            "life_segments": 0,
            "life_tasks": 0,
        }
        conflicts = {"tasks": []}

        # ── Twelve weeks ───────────────────────────────────────────
        tw = data.get("twelve_weeks") or {}
        goals_in = tw.get("goals") or []
        tasks_in = tw.get("tasks") or []

        goal_id_by_key: dict[str, int] = {}
        for g in goals_in if isinstance(goals_in, list) else []:
            if not isinstance(g, dict):
                continue
            key = g.get("key")
            text = (g.get("text") or "").strip()
            if not key or not text:
                continue
            obj = Goal.objects.create(user=user, text=text[:500], done=bool(g.get("done", False)))
            goal_id_by_key[str(key)] = obj.id
            created["goals"] += 1

        # Existing tasks for conflict detection
        existing_tasks = list(Task.objects.filter(user=user).exclude(start_hour__isnull=True).exclude(end_hour__isnull=True))
        occupied = {}  # (week, day) -> list of dict ranges
        for t in existing_tasks:
            if t.start_hour is None or t.start_minute is None or t.end_hour is None or t.end_minute is None:
                continue
            k = (int(t.week), int(t.day_of_week))
            occupied.setdefault(k, []).append({
                "start": _to_min(t.start_hour, t.start_minute),
                "end": _to_min(t.end_hour, t.end_minute),
                "id": t.id,
                "text": t.text,
                "type": t.type,
                "week": int(t.week),
                "day_of_week": int(t.day_of_week),
                "start_hour": t.start_hour,
                "start_minute": t.start_minute,
                "end_hour": t.end_hour,
                "end_minute": t.end_minute,
            })

        for t in tasks_in if isinstance(tasks_in, list) else []:
            if not isinstance(t, dict):
                continue

            text = (t.get("text") or "").strip()
            if not text:
                continue

            week = int(t.get("week", 1) or 1)
            day = int(t.get("day_of_week", 0) or 0)
            week = max(1, min(12, week))
            day = max(0, min(6, day))

            start_h = t.get("start_hour")
            start_m = t.get("start_minute")
            end_h = t.get("end_hour")
            end_m = t.get("end_minute")

            has_time = all(v is not None for v in [start_h, start_m, end_h, end_m])
            if has_time:
                try:
                    a_start = _to_min(int(start_h), int(start_m))
                    a_end = _to_min(int(end_h), int(end_m))
                except Exception:
                    has_time = False
                else:
                    if a_end <= a_start:
                        has_time = False

            # Conflict check (only when valid time range exists)
            if has_time:
                bucket = occupied.setdefault((week, day), [])
                hit = next((b for b in bucket if _task_overlap(a_start, a_end, b["start"], b["end"])), None)
                if hit:
                    conflicts["tasks"].append({
                        "import_task": {
                            "text": text,
                            "week": week,
                            "day_of_week": day,
                            "start_hour": int(start_h),
                            "start_minute": int(start_m),
                            "end_hour": int(end_h),
                            "end_minute": int(end_m),
                        },
                        "occupied_by": hit,
                    })
                    continue

            goal_key = t.get("goal_key")
            goal_id = goal_id_by_key.get(str(goal_key)) if goal_key else None
            obj = Task.objects.create(
                user=user,
                goal_id=goal_id,
                text=text[:500],
                done=bool(t.get("done", False)),
                type=t.get("type", "simple") if t.get("type") in ("important", "rest", "simple") else "simple",
                week=week,
                day_of_week=day,
                start_hour=int(start_h) if has_time else None,
                start_minute=int(start_m) if has_time else None,
                end_hour=int(end_h) if has_time else None,
                end_minute=int(end_m) if has_time else None,
            )
            created["tasks"] += 1
            if has_time:
                occupied[(week, day)].append({
                    "start": a_start,
                    "end": a_end,
                    "id": obj.id,
                    "text": obj.text,
                    "type": obj.type,
                    "week": week,
                    "day_of_week": day,
                    "start_hour": obj.start_hour,
                    "start_minute": obj.start_minute,
                    "end_hour": obj.end_hour,
                    "end_minute": obj.end_minute,
                })

        # ── Diary ──────────────────────────────────────────────────
        diary_in = data.get("diary") or []
        for e in diary_in if isinstance(diary_in, list) else []:
            if not isinstance(e, dict):
                continue
            et = e.get("type")
            if et not in ("week", "day"):
                continue
            text = (e.get("text") or "").strip()
            if not text:
                continue
            week = int(e.get("week", 1) or 1)
            week = max(1, min(12, week))
            day = e.get("day_of_week", None)
            if et == "day":
                try:
                    day = int(day if day is not None else 0)
                except Exception:
                    day = 0
                day = max(0, min(6, day))
            else:
                day = None

            date_raw = e.get("date")
            try:
                date = timezone.datetime.fromisoformat(date_raw.replace("Z", "+00:00")) if isinstance(date_raw, str) else timezone.now()
            except Exception:
                date = timezone.now()

            AchievementDiaryEntry.objects.create(
                user=user,
                type=et,
                week=week,
                day_of_week=day,
                text=text[:300],
                icon_key=(e.get("icon_key") or "trophy")[:50],
                date=date,
            )
            created["diary"] += 1

        # ── Progress ───────────────────────────────────────────────
        prog = data.get("progress") or {}
        cat_id_by_key: dict[str, int] = {}
        for c in (prog.get("categories") or []) if isinstance(prog.get("categories"), list) else []:
            if not isinstance(c, dict):
                continue
            key = c.get("key")
            name = (c.get("name") or "").strip()
            if not key or not name:
                continue
            obj = ProgressCategory.objects.create(
                user=user,
                name=name[:100],
                color=(c.get("color") or "#667eea")[:7],
            )
            cat_id_by_key[str(key)] = obj.id
            created["progress_categories"] += 1

        for tr in (prog.get("trackers") or []) if isinstance(prog.get("trackers"), list) else []:
            if not isinstance(tr, dict):
                continue
            name = (tr.get("name") or "").strip()
            if not name:
                continue
            kind = tr.get("kind") if tr.get("kind") in ("standard", "strength") else "standard"
            cat_key = tr.get("category_key")
            tracker = ProgressTracker.objects.create(
                user=user,
                category_id=cat_id_by_key.get(str(cat_key)) if cat_key else None,
                name=name[:200],
                kind=kind,
                unit=(tr.get("unit") or "")[:30],
                color=(tr.get("color") or "#1677ff")[:7],
                order=int(tr.get("order", 0) or 0),
            )
            created["progress_trackers"] += 1

            for r in tr.get("records", []) if isinstance(tr.get("records"), list) else []:
                if not isinstance(r, dict):
                    continue
                date_raw = r.get("date")
                try:
                    dt = timezone.datetime.fromisoformat(date_raw.replace("Z", "+00:00")) if isinstance(date_raw, str) else None
                except Exception:
                    dt = None
                if not dt:
                    continue
                ProgressRecord.objects.create(
                    tracker=tracker,
                    value=float(r.get("value", 0) or 0),
                    note=(r.get("note") or "")[:200],
                    date=dt,
                )
                created["progress_records"] += 1

            for r in tr.get("strength_records", []) if isinstance(tr.get("strength_records"), list) else []:
                if not isinstance(r, dict):
                    continue
                date_raw = r.get("date")
                try:
                    dt = timezone.datetime.fromisoformat(date_raw.replace("Z", "+00:00")) if isinstance(date_raw, str) else None
                except Exception:
                    dt = None
                if not dt:
                    continue
                StrengthRecord.objects.create(
                    tracker=tracker,
                    weight=float(r.get("weight", 0) or 0),
                    reps=int(r.get("reps", 1) or 1),
                    orm=float(r.get("orm", 0) or 0),
                    note=(r.get("note") or "")[:200],
                    date=dt,
                )
                created["progress_records"] += 1

        # ── Life wheel ─────────────────────────────────────────────
        lw = data.get("life_wheel") or {}
        for s in (lw.get("segments") or []) if isinstance(lw.get("segments"), list) else []:
            if not isinstance(s, dict):
                continue
            name = (s.get("name") or "").strip()
            if not name:
                continue
            seg = WheelSegment.objects.create(
                user=user,
                name=name[:100],
                score=int(s.get("score", 0) or 0),
                color=(s.get("color") or "#667eea")[:7],
                order=int(s.get("order", 0) or 0),
            )
            created["life_segments"] += 1
            for wt in s.get("tasks", []) if isinstance(s.get("tasks"), list) else []:
                if not isinstance(wt, dict):
                    continue
                text = (wt.get("text") or "").strip()
                if not text:
                    continue
                WheelTask.objects.create(
                    segment=seg,
                    text=text[:500],
                    done=bool(wt.get("done", False)),
                )
                created["life_tasks"] += 1

        return Response({
            "created": created,
            "conflicts": conflicts,
        })
