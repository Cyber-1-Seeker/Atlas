from django.db import models
from django.conf import settings

class Board(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='boards')
    title      = models.CharField(max_length=200, default='Новая доска')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} ({self.user})'

class BoardSnapshot(models.Model):
    """Хранит всё состояние доски — nodes + edges — как JSON."""
    board    = models.OneToOneField(Board, on_delete=models.CASCADE, related_name='snapshot')
    nodes    = models.JSONField(default=list)
    edges    = models.JSONField(default=list)
    viewport = models.JSONField(default=dict)  # {x, y, zoom}
    saved_at = models.DateTimeField(auto_now=True)
