from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ProgressCategory, ProgressTracker, ProgressRecord, StrengthRecord
from .serializers import (
    ProgressCategorySerializer, ProgressTrackerSerializer,
    ProgressRecordSerializer, StrengthRecordSerializer,
)

class ProgressCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressCategorySerializer

    def get_queryset(self):
        return ProgressCategory.objects.filter(user=self.request.user)

    def perform_create(self, s): s.save(user=self.request.user)

class ProgressTrackerViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressTrackerSerializer

    def get_queryset(self):
        return ProgressTracker.objects.filter(user=self.request.user)

    def perform_create(self, s): s.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='records')
    def add_record(self, request, pk=None):
        tracker = self.get_object()
        s = ProgressRecordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(tracker=tracker)
        return Response(s.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='records/(?P<record_id>[^/.]+)')
    def delete_record(self, request, pk=None, record_id=None):
        ProgressRecord.objects.filter(id=record_id, tracker__user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='strength-records')
    def add_strength_record(self, request, pk=None):
        tracker = self.get_object()
        s = StrengthRecordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(tracker=tracker)
        return Response(s.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='strength-records/(?P<record_id>[^/.]+)')
    def delete_strength_record(self, request, pk=None, record_id=None):
        StrengthRecord.objects.filter(id=record_id, tracker__user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        """Импорт всех трекеров из localStorage."""
        trackers_data = request.data if isinstance(request.data, list) else []
        created_ids = []
        for td in trackers_data:
            tracker = ProgressTracker.objects.create(
                user=request.user,
                name=td.get('name',''),
                kind=td.get('kind','standard'),
                unit=td.get('unit',''),
                color=td.get('color','#1677ff'),
            )
            created_ids.append(tracker.id)
            for r in td.get('records', []):
                ProgressRecord.objects.create(
                    tracker=tracker,
                    value=r.get('value',0),
                    note=r.get('note',''),
                    date=r.get('date'),
                )
            for r in td.get('strengthRecords', []):
                StrengthRecord.objects.create(
                    tracker=tracker,
                    weight=r.get('weight',0),
                    reps=r.get('reps',1),
                    orm=r.get('orm',0),
                    note=r.get('note',''),
                    date=r.get('date'),
                )
        trackers = ProgressTracker.objects.filter(id__in=created_ids)
        return Response(ProgressTrackerSerializer(trackers, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='reorder')
    def reorder(self, request, pk=None):
        tracker = self.get_object()
        tracker.order = request.data.get('order', tracker.order)
        tracker.save(update_fields=['order'])
        return Response({'order': tracker.order})
