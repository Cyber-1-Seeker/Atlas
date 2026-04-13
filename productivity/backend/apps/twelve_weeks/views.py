from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from .models import Goal, Task, AchievementDiaryEntry
from .serializers import GoalSerializer, TaskSerializer, AchievementDiaryEntrySerializer

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Массовое создание для импорта данных из localStorage."""
        items = request.data if isinstance(request.data, list) else []
        created = []
        for item in items:
            s = GoalSerializer(data=item)
            if s.is_valid():
                created.append(s.save(user=request.user))
        return Response(GoalSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        items = request.data if isinstance(request.data, list) else []
        created = []
        for item in items:
            # Преобразуем формат из frontend (startTime/endTime → flat поля)
            flat = {
                'text':       item.get('text',''),
                'done':       item.get('done', False),
                'type':       item.get('type','simple'),
                'week':       item.get('week', 1),
                'day_of_week': item.get('dayOfWeek', 0),
                'start_hour':   item.get('startTime', {}).get('hour') if item.get('startTime') else None,
                'start_minute': item.get('startTime', {}).get('minute') if item.get('startTime') else None,
                'end_hour':   item.get('endTime', {}).get('hour') if item.get('endTime') else None,
                'end_minute': item.get('endTime', {}).get('minute') if item.get('endTime') else None,
            }
            s = TaskSerializer(data=flat)
            if s.is_valid():
                created.append(s.save(user=request.user))
        return Response(TaskSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class AchievementDiaryEntryViewSet(viewsets.ModelViewSet):
    serializer_class = AchievementDiaryEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = AchievementDiaryEntry.objects.filter(user=self.request.user)
        entry_type = self.request.query_params.get('type')
        week = self.request.query_params.get('week')
        day = self.request.query_params.get('day_of_week')

        if entry_type in ('week', 'day'):
            qs = qs.filter(type=entry_type)
        if week is not None:
            try:
                qs = qs.filter(week=int(week))
            except ValueError:
                pass
        if day is not None:
            try:
                qs = qs.filter(day_of_week=int(day))
            except ValueError:
                pass
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
