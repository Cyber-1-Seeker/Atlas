from django.db import models
from django.conf import settings
from django.utils import timezone

class Goal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    text = models.CharField(max_length=500)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class Task(models.Model):
    TYPE_CHOICES = [('important','important'), ('rest','rest'), ('simple','simple')]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    goal       = models.ForeignKey(Goal, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks')
    text       = models.CharField(max_length=500)
    done       = models.BooleanField(default=False)
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='simple')
    week       = models.PositiveSmallIntegerField(default=1)
    day_of_week = models.PositiveSmallIntegerField(default=0)  # 0=Пн
    start_hour   = models.PositiveSmallIntegerField(null=True, blank=True)
    start_minute = models.PositiveSmallIntegerField(null=True, blank=True)
    end_hour     = models.PositiveSmallIntegerField(null=True, blank=True)
    end_minute   = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['week', 'day_of_week', 'start_hour', 'start_minute']


class AchievementDiaryEntry(models.Model):
    TYPE_CHOICES = [('week', 'week'), ('day', 'day')]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievement_diary_entries')
    type       = models.CharField(max_length=10, choices=TYPE_CHOICES)
    week       = models.PositiveSmallIntegerField(default=1)
    day_of_week = models.PositiveSmallIntegerField(null=True, blank=True)  # для type='day'

    text       = models.CharField(max_length=300)
    icon_key   = models.CharField(max_length=50, default='trophy')
    date       = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']
