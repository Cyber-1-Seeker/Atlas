from django.db import models
from django.conf import settings

class ProgressCategory(models.Model):
    user  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress_categories')
    name  = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#667eea')

    class Meta:
        ordering = ['id']

class ProgressTracker(models.Model):
    KIND_CHOICES = [('standard','standard'), ('strength','strength')]

    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trackers')
    category = models.ForeignKey(ProgressCategory, null=True, blank=True, on_delete=models.SET_NULL)
    name     = models.CharField(max_length=200)
    kind     = models.CharField(max_length=20, choices=KIND_CHOICES, default='standard')
    unit     = models.CharField(max_length=30, blank=True)
    color    = models.CharField(max_length=7, default='#1677ff')
    order    = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

class ProgressRecord(models.Model):
    tracker = models.ForeignKey(ProgressTracker, on_delete=models.CASCADE, related_name='records')
    value   = models.FloatField()
    note    = models.CharField(max_length=200, blank=True)
    date    = models.DateTimeField()

    class Meta:
        ordering = ['date']

class StrengthRecord(models.Model):
    tracker = models.ForeignKey(ProgressTracker, on_delete=models.CASCADE, related_name='strength_records')
    weight  = models.FloatField()
    reps    = models.PositiveSmallIntegerField()
    orm     = models.FloatField()
    note    = models.CharField(max_length=200, blank=True)
    date    = models.DateTimeField()

    class Meta:
        ordering = ['date']
