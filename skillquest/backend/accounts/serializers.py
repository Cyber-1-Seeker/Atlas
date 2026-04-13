from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProgress, UserTaskProgress
from skills.models import Checkpoint, Task


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=40)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    display_name = serializers.CharField(required=False, default='')

    def validate_username(self, v):
        if User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError('Имя пользователя занято')
        return v

    def validate_email(self, v):
        if User.objects.filter(email__iexact=v).exists():
            raise serializers.ValidationError('Email уже используется')
        return v

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            display_name=validated_data.get('display_name', ''),
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Неверное имя или пароль')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    total_xp = serializers.SerializerMethodField()
    completed_checkpoints = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 'avatar_emoji',
            'accent_color', 'date_joined', 'streak', 'last_activity_date',
            'total_xp', 'completed_checkpoints', 'completed_tasks_count',
        ]
        read_only_fields = ['id', 'date_joined', 'streak', 'last_activity_date']

    def get_total_xp(self, obj):
        cp_xp = sum(
            p.checkpoint.xp_reward for p in obj.progress.select_related('checkpoint')
        )
        task_xp = sum(
            p.task.xp_reward for p in obj.task_progress.select_related('task')
        )
        return cp_xp + task_xp

    def get_completed_checkpoints(self, obj):
        return obj.progress.count()

    def get_completed_tasks_count(self, obj):
        return obj.task_progress.count()


class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ['checkpoint', 'completed_at']


class UserTaskProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTaskProgress
        fields = ['task', 'completed_at']


class FullProgressSerializer(serializers.Serializer):
    """Returns all completed checkpoint IDs and task IDs for current user."""
    completed_checkpoints = serializers.ListField(child=serializers.UUIDField())
    completed_tasks = serializers.ListField(child=serializers.UUIDField())


class SyncProgressSerializer(serializers.Serializer):
    """Bulk-sync progress from client (for first login / offline merge)."""
    completed_checkpoints = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=[]
    )
    completed_tasks = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=[]
    )
