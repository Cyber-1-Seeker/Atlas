from django.utils import timezone
from datetime import date, timedelta
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserProgress, UserTaskProgress
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    FullProgressSerializer, SyncProgressSerializer,
)
from skills.models import Checkpoint, Task


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        user = ser.save()
        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        }, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        user = ser.validated_data['user']
        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        })


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        # Only allow updating certain fields
        allowed = {'display_name', 'avatar_emoji', 'accent_color'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        ser = UserSerializer(request.user, data=data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        ser.save()
        return Response(ser.data)


class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return all completed checkpoint and task IDs."""
        cp_ids = list(
            UserProgress.objects.filter(user=request.user)
            .values_list('checkpoint_id', flat=True)
        )
        task_ids = list(
            UserTaskProgress.objects.filter(user=request.user)
            .values_list('task_id', flat=True)
        )
        return Response({
            'completed_checkpoints': [str(i) for i in cp_ids],
            'completed_tasks': [str(i) for i in task_ids],
        })


class CompleteTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task_id = request.data.get('task_id')
        undo = request.data.get('undo', False)

        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        if undo:
            UserTaskProgress.objects.filter(user=request.user, task=task).delete()
            return Response({'status': 'removed'})

        UserTaskProgress.objects.get_or_create(user=request.user, task=task)
        _update_streak(request.user)
        return Response({'status': 'completed'})


class CompleteCheckpointView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cp_id = request.data.get('checkpoint_id')
        undo = request.data.get('undo', False)

        try:
            cp = Checkpoint.objects.get(id=cp_id)
        except Checkpoint.DoesNotExist:
            return Response({'error': 'Checkpoint not found'}, status=404)

        if undo:
            UserProgress.objects.filter(user=request.user, checkpoint=cp).delete()
            return Response({'status': 'removed'})

        UserProgress.objects.get_or_create(user=request.user, checkpoint=cp)
        _update_streak(request.user)
        return Response({'status': 'completed'})


class SyncProgressView(APIView):
    """Bulk import progress — used when user logs in for the first time
    and we want to merge their localStorage progress into the server."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = SyncProgressSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        d = ser.validated_data
        created_cp = created_task = 0

        for cp_id in d['completed_checkpoints']:
            try:
                cp = Checkpoint.objects.get(id=cp_id)
                _, created = UserProgress.objects.get_or_create(user=request.user, checkpoint=cp)
                if created: created_cp += 1
            except Checkpoint.DoesNotExist:
                pass

        for task_id in d['completed_tasks']:
            try:
                task = Task.objects.get(id=task_id)
                _, created = UserTaskProgress.objects.get_or_create(user=request.user, task=task)
                if created: created_task += 1
            except Task.DoesNotExist:
                pass

        if created_cp + created_task > 0:
            _update_streak(request.user)

        return Response({
            'synced_checkpoints': created_cp,
            'synced_tasks': created_task,
        })


def _update_streak(user: User):
    """Update streak counter. Call after any activity."""
    today = date.today()
    if user.last_activity_date == today:
        return  # already recorded today
    yesterday = today - timedelta(days=1)
    if user.last_activity_date == yesterday:
        user.streak += 1
    else:
        user.streak = 1
    user.last_activity_date = today
    user.save(update_fields=['streak', 'last_activity_date'])
