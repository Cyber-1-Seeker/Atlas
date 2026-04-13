from django.db import models
from django.conf import settings

class WheelSegment(models.Model):
    user  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wheel_segments')
    name  = models.CharField(max_length=100)
    score = models.PositiveSmallIntegerField(default=0)
    color = models.CharField(max_length=7, default='#667eea')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

class WheelTask(models.Model):
    segment = models.ForeignKey(WheelSegment, on_delete=models.CASCADE, related_name='tasks')
    text    = models.CharField(max_length=500)
    done    = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']
