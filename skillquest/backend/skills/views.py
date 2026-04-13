from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Direction, Branch, Checkpoint, Task
from .serializers import (
    DirectionSerializer, DirectionListSerializer,
    BranchSerializer, CheckpointSerializer, TaskSerializer,
    DirectionImportSerializer,
)


class DirectionViewSet(viewsets.ModelViewSet):
    queryset = Direction.objects.all()

    def get_serializer_class(self):
        return DirectionListSerializer if self.action == 'list' else DirectionSerializer

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        return Response(DirectionSerializer(self.get_object()).data)

    @action(detail=False, methods=['post'])
    def import_json(self, request):
        ser = DirectionImportSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        d = ser.validated_data
        with transaction.atomic():
            direction, _ = Direction.objects.update_or_create(
                slug=d['slug'],
                defaults={'name':d['name'],'icon_type':d['icon_type'],'description':d['description'],'color_hex':d['color_hex']}
            )
            for b_data in d['branches']:
                branch = Branch.objects.create(
                    direction=direction, title=b_data['title'],
                    description=b_data['description'], color_hex=b_data['color_hex'],
                    order=b_data['order'], is_hardcore=b_data['is_hardcore'],
                )
                created: list[tuple[Checkpoint, list[int]]] = []
                for cp_data in b_data['checkpoints']:
                    cp = Checkpoint.objects.create(
                        branch=branch, title=cp_data['title'], description=cp_data['description'],
                        icon_type=cp_data['icon_type'], xp_reward=cp_data['xp_reward'],
                        order=cp_data['order'], pos_x=cp_data['pos_x'], pos_y=cp_data['pos_y'],
                        achievement_name=cp_data['achievement_name'],
                        achievement_description=cp_data['achievement_description'],
                        achievement_icon=cp_data['achievement_icon'],
                    )
                    for t in cp_data['tasks']:
                        Task.objects.create(checkpoint=cp, **{k:t[k] for k in ['title','content_md','xp_reward','difficulty_rating','order','hardcore_xp_multiplier','hardcore_description']})
                    created.append((cp, cp_data.get('prerequisite_orders', [])))
                # wire M2M prerequisites
                for cp, prereq_orders in created:
                    for po in prereq_orders:
                        prereq = next((c for c, _ in created if c.order == po), None)
                        if prereq:
                            cp.prerequisites.add(prereq)
        return Response(DirectionSerializer(direction).data, status=201)


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    def get_queryset(self):
        qs = Branch.objects.all()
        d = self.request.query_params.get('direction')
        return qs.filter(direction_id=d) if d else qs


class CheckpointViewSet(viewsets.ModelViewSet):
    serializer_class = CheckpointSerializer

    def get_queryset(self):
        qs = Checkpoint.objects.prefetch_related('prerequisites','tasks')
        b = self.request.query_params.get('branch')
        return qs.filter(branch_id=b) if b else qs

    def perform_update(self, serializer):
        # Allow partial update of prerequisites list
        instance = serializer.save()
        prereqs = self.request.data.get('prerequisites')
        if prereqs is not None:
            instance.prerequisites.set(prereqs)

    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        """Update pos_x, pos_y only — called on drag end."""
        cp = self.get_object()
        cp.pos_x = int(request.data.get('pos_x', cp.pos_x))
        cp.pos_y = int(request.data.get('pos_y', cp.pos_y))
        cp.save(update_fields=['pos_x','pos_y'])
        return Response({'id': str(cp.id), 'pos_x': cp.pos_x, 'pos_y': cp.pos_y})

    @action(detail=True, methods=['post'])
    def add_prerequisite(self, request, pk=None):
        cp = self.get_object()
        prereq_id = request.data.get('prerequisite_id')
        try:
            prereq = Checkpoint.objects.get(id=prereq_id, branch=cp.branch)
            cp.prerequisites.add(prereq)
            return Response({'ok': True})
        except Checkpoint.DoesNotExist:
            return Response({'error': 'not found'}, status=404)

    @action(detail=True, methods=['post'])
    def remove_prerequisite(self, request, pk=None):
        cp = self.get_object()
        prereq_id = request.data.get('prerequisite_id')
        try:
            prereq = Checkpoint.objects.get(id=prereq_id)
            cp.prerequisites.remove(prereq)
            return Response({'ok': True})
        except Checkpoint.DoesNotExist:
            return Response({'error': 'not found'}, status=404)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    def get_queryset(self):
        qs = Task.objects.all()
        c = self.request.query_params.get('checkpoint')
        return qs.filter(checkpoint_id=c) if c else qs
