from rest_framework import serializers
from .models import Board, BoardSnapshot

class BoardSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BoardSnapshot
        fields = ('nodes', 'edges', 'viewport', 'saved_at')

class BoardSerializer(serializers.ModelSerializer):
    snapshot = BoardSnapshotSerializer(read_only=True)

    class Meta:
        model  = Board
        fields = ('id', 'title', 'created_at', 'updated_at', 'snapshot')
        read_only_fields = ('id', 'created_at', 'updated_at')

class BoardListSerializer(serializers.ModelSerializer):
    """Лёгкий сериализатор для списка — без snapshot."""
    class Meta:
        model  = Board
        fields = ('id', 'title', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
