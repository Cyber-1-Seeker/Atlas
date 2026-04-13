from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    MuscleGroup, Exercise, ExerciseMuscle,
    TrainingProgram, TrainingDay, DaySection, DayExercise,
    WorkoutSession, SessionSet,
)
from .serializers import (
    MuscleGroupSerializer, MuscleGroupWriteSerializer,
    ExerciseListSerializer, ExerciseDetailSerializer, ExerciseWriteSerializer,
    TrainingProgramSerializer, TrainingProgramListSerializer,
    TrainingDaySerializer, DaySectionSerializer, DayExerciseSerializer,
    WorkoutSessionSerializer, SessionSetSerializer,
)

def calc_orm(w, r):
    if r == 1:  return round(w, 1)
    if r >= 37: return round(w * (1 + r/30), 1)
    return round(w / (1.0278 - 0.0278 * r), 1)


class IsSuperuserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_superuser


# ── Мышцы ────────────────────────────────────────────────────────
class MuscleGroupViewSet(viewsets.ModelViewSet):
    queryset = MuscleGroup.objects.all()
    permission_classes = [IsSuperuserOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ('POST','PUT','PATCH'):
            return MuscleGroupWriteSerializer
        return MuscleGroupSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=False, methods=['get'], url_path='by-region')
    def by_region(self, request):
        region = request.query_params.get('region','')
        qs = self.get_queryset()
        if region: qs = qs.filter(body_region=region)
        return Response(MuscleGroupSerializer(qs, many=True, context={'request':request}).data)


# ── Упражнения ───────────────────────────────────────────────────
class ExerciseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperuserOrReadOnly]

    def get_queryset(self):
        qs = Exercise.objects.prefetch_related('muscles__muscle')
        if not (self.request.user.is_authenticated and self.request.user.is_superuser):
            qs = qs.filter(is_published=True)
        q         = self.request.query_params.get('q')
        category  = self.request.query_params.get('category')
        muscle    = self.request.query_params.get('muscle')
        equipment = self.request.query_params.get('equipment')
        if q:         qs = qs.filter(name__icontains=q)
        if category:  qs = qs.filter(category=category)
        if equipment: qs = qs.filter(equipment=equipment)
        if muscle:    qs = qs.filter(muscles__muscle__key=muscle)
        return qs.distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':      return ExerciseDetailSerializer
        if self.request.method in ('POST','PUT','PATCH'): return ExerciseWriteSerializer
        return ExerciseListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post','delete'], url_path='muscles/(?P<muscle_id>[^/.]+)')
    def manage_muscle(self, request, pk=None, muscle_id=None):
        ex = self.get_object()
        if request.method == 'POST':
            intensity = int(request.data.get('intensity', 2))
            em, _ = ExerciseMuscle.objects.update_or_create(
                exercise=ex, muscle_id=muscle_id,
                defaults={'intensity': intensity},
            )
            return Response(status=status.HTTP_200_OK)
        ExerciseMuscle.objects.filter(exercise=ex, muscle_id=muscle_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Программы ────────────────────────────────────────────────────
class TrainingProgramViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TrainingProgram.objects.filter(user=self.request.user).prefetch_related(
            'days__sections__exercises__exercise__muscles__muscle'
        )

    def get_serializer_class(self):
        return TrainingProgramListSerializer if self.action == 'list' else TrainingProgramSerializer

    def perform_create(self, s):
        s.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        TrainingProgram.objects.filter(user=request.user).update(is_active=False)
        prog = self.get_object()
        prog.is_active = True; prog.save(update_fields=['is_active'])
        return Response({'status': 'activated'})


# ── Дни ──────────────────────────────────────────────────────────
class TrainingDayViewSet(viewsets.ModelViewSet):
    serializer_class   = TrainingDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TrainingDay.objects.filter(
            program__user=self.request.user
        ).prefetch_related('sections__exercises__exercise__muscles__muscle')

    def perform_create(self, serializer):
        # program приходит через program_id → source='program' в сериализаторе
        # Проверяем что программа принадлежит пользователю
        program = serializer.validated_data.get('program')
        if program and program.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save()

    @action(detail=True, methods=['post'], url_path='add-section')
    def add_section(self, request, pk=None):
        day   = self.get_object()
        order = day.sections.count()
        sec   = DaySection.objects.create(
            day=day, title=request.data.get('title',''), order=order
        )
        return Response(DaySectionSerializer(sec).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='add-exercise')
    def add_exercise(self, request, pk=None):
        day     = self.get_object()
        sec_id  = request.data.get('section_id')
        ex_id   = request.data.get('exercise_id')
        sets    = request.data.get('sets_count', 3)
        reps    = request.data.get('reps_hint', '')
        section = DaySection.objects.get(id=sec_id, day=day)
        de      = DayExercise.objects.create(
            section=section, exercise_id=ex_id,
            order=section.exercises.count(),
            sets_count=sets, reps_hint=reps,
        )
        return Response(DayExerciseSerializer(de).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remove-exercise/(?P<de_id>[^/.]+)')
    def remove_exercise(self, request, pk=None, de_id=None):
        DayExercise.objects.filter(id=de_id, section__day=self.get_object()).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Сессии ───────────────────────────────────────────────────────
class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class   = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user).prefetch_related('sets')

    def perform_create(self, s):
        s.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='finish')
    def finish(self, request, pk=None):
        s = self.get_object()
        s.ended = timezone.now(); s.save(update_fields=['ended'])
        return Response({'status':'finished'})

    @action(detail=True, methods=['post'], url_path='log-set')
    def log_set(self, request, pk=None):
        session    = self.get_object()
        de_id      = request.data.get('day_exercise_id')
        set_number = int(request.data.get('set_number', 1))
        weight     = float(request.data.get('weight', 0))
        reps       = int(request.data.get('reps', 1))
        orm        = calc_orm(weight, reps)

        # Удаляем предыдущую запись этого подхода если переписывают
        SessionSet.objects.filter(
            session=session, day_exercise_id=de_id, set_number=set_number
        ).delete()

        ss = SessionSet.objects.create(
            session=session, day_exercise_id=de_id,
            set_number=set_number, weight=weight, reps=reps, orm=orm,
        )
        self._sync_tracker(session, de_id, weight, reps, orm)
        return Response(SessionSetSerializer(ss).data, status=status.HTTP_201_CREATED)

    def _sync_tracker(self, session, de_id, weight, reps, orm):
        try:
            from apps.progress.models import ProgressTracker, StrengthRecord, ProgressCategory
            de       = DayExercise.objects.select_related(
                'exercise','section__day__program').get(id=de_id)
            prog     = de.section.day.program
            ex_name  = de.exercise.name
            cat, _   = ProgressCategory.objects.get_or_create(
                user=session.user, name=prog.name, defaults={'color':'#667eea'})
            tracker, _ = ProgressTracker.objects.get_or_create(
                user=session.user, name=ex_name, kind='strength',
                defaults={'unit':'кг','color':'#1677ff','category':cat},
            )
            if not tracker.category:
                tracker.category = cat; tracker.save(update_fields=['category'])
            StrengthRecord.objects.create(
                tracker=tracker, weight=weight, reps=reps, orm=orm,
                note=f'{prog.name} / {de.section.day.name}',
                date=timezone.now(),
            )
        except Exception: pass

    @action(detail=False, methods=['get'], url_path='last-for-exercise')
    def last_for_exercise(self, request):
        ex_id = request.query_params.get('exercise_id')
        if not ex_id: return Response([])
        sets = SessionSet.objects.filter(
            session__user=request.user,
            day_exercise__exercise_id=ex_id,
        ).order_by('-session__date','-set_number')
        last_sid = sets.values_list('session_id',flat=True).first()
        if not last_sid: return Response([])
        return Response(SessionSetSerializer(sets.filter(session_id=last_sid), many=True).data)

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        """История тренировок — сессии с кол-вом подходов."""
        sessions = self.get_queryset().order_by('-date')[:20]
        return Response(WorkoutSessionSerializer(sessions, many=True).data)
