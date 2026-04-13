from rest_framework import serializers
from .models import Goal, Task, AchievementDiaryEntry

class GoalSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    done_count = serializers.SerializerMethodField()

    class Meta:
        model  = Goal
        fields = ('id','text','done','created_at','task_count','done_count')
        read_only_fields = ('id','created_at')

    def get_task_count(self, obj): return obj.tasks.count()
    def get_done_count(self, obj): return obj.tasks.filter(done=True).count()

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Task
        fields = ('id','goal','text','done','type','week','day_of_week',
                  'start_hour','start_minute','end_hour','end_minute','created_at')
        read_only_fields = ('id','created_at')


class AchievementDiaryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementDiaryEntry
        fields = ('id', 'type', 'week', 'day_of_week', 'text', 'icon_key', 'date', 'created_at')
        read_only_fields = ('id', 'created_at')
