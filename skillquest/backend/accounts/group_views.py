from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q
from .models import Group, GroupMembership, UserProgress, UserTaskProgress, User
from skills.models import Direction, Checkpoint, Task
from skills.serializers import DirectionListSerializer


# ── Serializer helpers ────────────────────────────────────────────────────

def serialize_member(membership, group_direction=None):
    u = membership.user
    # Compute XP: checkpoint XP + task XP
    cp_xp = sum(
        p.checkpoint.xp_reward
        for p in u.progress.select_related('checkpoint')
    )
    task_xp = sum(
        p.task.xp_reward
        for p in u.task_progress.select_related('task')
    )

    # If group has a direction, also compute progress within that direction
    direction_progress = None
    if group_direction:
        dir_checkpoints = list(
            Checkpoint.objects.filter(branch__direction=group_direction)
        )
        dir_tasks = list(
            Task.objects.filter(checkpoint__branch__direction=group_direction)
        )
        done_cps = u.progress.filter(
            checkpoint__branch__direction=group_direction
        ).count()
        done_tasks = u.task_progress.filter(
            task__checkpoint__branch__direction=group_direction
        ).count()
        direction_progress = {
            'done_checkpoints': done_cps,
            'total_checkpoints': len(dir_checkpoints),
            'done_tasks': done_tasks,
            'total_tasks': len(dir_tasks),
            'pct': round((done_tasks / len(dir_tasks) * 100) if dir_tasks else 0),
        }

    return {
        'id': str(u.id),
        'username': u.username,
        'display_name': u.display_name or u.username,
        'avatar_emoji': u.avatar_emoji,
        'accent_color': u.accent_color,
        'streak': u.streak,
        'role': membership.role,
        'joined_at': membership.joined_at.isoformat(),
        'total_xp': cp_xp + task_xp,
        'completed_checkpoints': u.progress.count(),
        'completed_tasks': u.task_progress.count(),
        'direction_progress': direction_progress,
    }


def serialize_group(group, user=None):
    memberships = group.memberships.select_related('user').prefetch_related(
        'user__progress__checkpoint',
        'user__task_progress__task',
    )
    members = [serialize_member(m, group.direction) for m in memberships]

    # Sort leaderboard by total_xp desc
    leaderboard = sorted(members, key=lambda m: m['total_xp'], reverse=True)
    for i, m in enumerate(leaderboard):
        m['rank'] = i + 1

    return {
        'id': str(group.id),
        'name': group.name,
        'description': group.description,
        'emoji': group.emoji,
        'color_hex': group.color_hex,
        'invite_code': group.invite_code,
        'owner_id': str(group.owner_id),
        'direction': {
            'id': str(group.direction.id),
            'name': group.direction.name,
            'color_hex': group.direction.color_hex,
            'icon_type': group.direction.icon_type,
        } if group.direction else None,
        'member_count': len(members),
        'members': leaderboard,
        'created_at': group.created_at.isoformat(),
        'is_owner': str(group.owner_id) == str(user.id) if user else False,
    }


# ── Views ─────────────────────────────────────────────────────────────────

class GroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all groups the user belongs to."""
        groups = Group.objects.filter(
            memberships__user=request.user
        ).select_related('owner', 'direction').prefetch_related('memberships')
        return Response([serialize_group(g, request.user) for g in groups])

    def post(self, request):
        """Create a new group."""
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Название обязательно'}, status=400)

        direction_id = request.data.get('direction_id')
        direction = None
        if direction_id:
            try:
                direction = Direction.objects.get(id=direction_id)
            except Direction.DoesNotExist:
                return Response({'error': 'Direction not found'}, status=404)

        group = Group.objects.create(
            name=name,
            description=request.data.get('description', ''),
            emoji=request.data.get('emoji', '⚔'),
            color_hex=request.data.get('color_hex', '#7c3aed'),
            owner=request.user,
            direction=direction,
        )
        GroupMembership.objects.create(group=group, user=request.user, role='owner')
        return Response(serialize_group(group, request.user), status=201)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_group(self, pk, user):
        try:
            g = Group.objects.select_related('owner', 'direction').get(id=pk)
            if not g.memberships.filter(user=user).exists():
                return None, Response({'error': 'Not a member'}, status=403)
            return g, None
        except Group.DoesNotExist:
            return None, Response({'error': 'Not found'}, status=404)

    def get(self, request, pk):
        group, err = self._get_group(pk, request.user)
        if err: return err
        return Response(serialize_group(group, request.user))

    def patch(self, request, pk):
        group, err = self._get_group(pk, request.user)
        if err: return err
        if group.owner != request.user:
            return Response({'error': 'Only owner can edit'}, status=403)
        allowed = {'name', 'description', 'emoji', 'color_hex'}
        for k, v in request.data.items():
            if k in allowed:
                setattr(group, k, v)
        if 'direction_id' in request.data:
            try:
                group.direction = Direction.objects.get(id=request.data['direction_id'])
            except Direction.DoesNotExist:
                pass
        group.save()
        return Response(serialize_group(group, request.user))

    def delete(self, request, pk):
        group, err = self._get_group(pk, request.user)
        if err: return err
        if group.owner != request.user:
            return Response({'error': 'Only owner can delete'}, status=403)
        group.delete()
        return Response(status=204)


class JoinGroupView(APIView):
    """Join a group via invite code."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('invite_code', '').strip().upper()
        if not code:
            return Response({'error': 'Введи код приглашения'}, status=400)
        try:
            group = Group.objects.select_related('owner', 'direction').get(invite_code=code)
        except Group.DoesNotExist:
            return Response({'error': 'Неверный код'}, status=404)

        if group.memberships.filter(user=request.user).exists():
            return Response({'error': 'Ты уже в этой группе'}, status=400)

        GroupMembership.objects.create(group=group, user=request.user, role='member')
        return Response(serialize_group(group, request.user), status=201)


class LeaveGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            membership = GroupMembership.objects.get(group_id=pk, user=request.user)
        except GroupMembership.DoesNotExist:
            return Response({'error': 'Not a member'}, status=404)
        if membership.role == 'owner':
            return Response({'error': 'Owner cannot leave. Delete the group instead.'}, status=400)
        membership.delete()
        return Response(status=204)


class RegenerateInviteView(APIView):
    """Generate a new invite code for the group."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            group = Group.objects.get(id=pk, owner=request.user)
        except Group.DoesNotExist:
            return Response({'error': 'Not found or not owner'}, status=404)
        import secrets
        group.invite_code = secrets.token_urlsafe(8)[:8].upper()
        group.save(update_fields=['invite_code'])
        return Response({'invite_code': group.invite_code})
