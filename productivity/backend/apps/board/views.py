from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Board, BoardSnapshot
from .serializers import BoardSerializer, BoardListSerializer

class BoardViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Board.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return BoardListSerializer
        return BoardSerializer

    def perform_create(self, serializer):
        board = serializer.save(user=self.request.user)
        # Создаём пустой snapshot сразу
        BoardSnapshot.objects.create(board=board)

    @action(detail=True, methods=['post'], url_path='save')
    def save_snapshot(self, request, pk=None):
        """Сохранить состояние доски (nodes + edges + viewport)."""
        board = self.get_object()
        snapshot, _ = BoardSnapshot.objects.get_or_create(board=board)
        snapshot.nodes    = request.data.get('nodes', [])
        snapshot.edges    = request.data.get('edges', [])
        snapshot.viewport = request.data.get('viewport', {})
        snapshot.save()
        return Response({'status': 'saved', 'saved_at': snapshot.saved_at})

    @action(detail=True, methods=['get'], url_path='load')
    def load_snapshot(self, request, pk=None):
        """Загрузить полное состояние доски."""
        board = self.get_object()
        snapshot, _ = BoardSnapshot.objects.get_or_create(board=board)
        return Response({
            'nodes':    snapshot.nodes,
            'edges':    snapshot.edges,
            'viewport': snapshot.viewport,
        })
