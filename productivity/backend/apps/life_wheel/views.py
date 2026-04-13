from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WheelSegment, WheelTask
from .serializers import WheelSegmentSerializer, WheelTaskSerializer

class WheelSegmentViewSet(viewsets.ModelViewSet):
    serializer_class = WheelSegmentSerializer

    def get_queryset(self):
        return WheelSegment.objects.filter(user=self.request.user)

    def perform_create(self, s): s.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='tasks')
    def add_task(self, request, pk=None):
        segment = self.get_object()
        s = WheelTaskSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(segment=segment)
        return Response(s.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='tasks/(?P<task_id>[^/.]+)')
    def update_task(self, request, pk=None, task_id=None):
        task = WheelTask.objects.get(id=task_id, segment__user=request.user)
        s = WheelTaskSerializer(task, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    @action(detail=True, methods=['delete'], url_path='tasks/(?P<task_id>[^/.]+)/delete')
    def delete_task(self, request, pk=None, task_id=None):
        WheelTask.objects.filter(id=task_id, segment__user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        segments_data = request.data if isinstance(request.data, list) else []
        created_ids = []
        for i, sd in enumerate(segments_data):
            seg = WheelSegment.objects.create(
                user=request.user,
                name=sd.get('name',''),
                score=sd.get('score',0),
                color=sd.get('color','#667eea'),
                order=i,
            )
            created_ids.append(seg.id)
            for t in sd.get('tasks', []):
                WheelTask.objects.create(
                    segment=seg,
                    text=t.get('text',''),
                    done=t.get('done', False),
                )
        segs = WheelSegment.objects.filter(id__in=created_ids)
        return Response(WheelSegmentSerializer(segs, many=True).data, status=status.HTTP_201_CREATED)
