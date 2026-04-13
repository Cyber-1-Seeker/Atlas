"""
ДОБАВИТЬ в apps/progress/models.py:

После класса StrengthRecord добавить RunningRecord:
"""

class RunningRecord(models.Model):
    """Запись бегового трекера: дистанция (м) + время (сек) → темп."""
    tracker   = models.ForeignKey('ProgressTracker', on_delete=models.CASCADE, related_name='running_records')
    distance  = models.FloatField(help_text='Дистанция в метрах')
    duration  = models.FloatField(help_text='Время в секундах')
    pace      = models.FloatField(help_text='Темп мин/км (авторасчёт)', blank=True)
    note      = models.CharField(max_length=200, blank=True)
    date      = models.DateTimeField()

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        # Темп мин/км = (время_сек / 60) / (дистанция_м / 1000)
        if self.distance and self.duration:
            km = self.distance / 1000
            self.pace = round((self.duration / 60) / km, 2) if km > 0 else 0
        super().save(*args, **kwargs)

"""
ИЗМЕНИТЬ TrackerKind в ProgressTracker:
"""
# KIND = [('standard','Обычный'),('strength','Силовой'),('running','Беговой')]
# Заменить:
KIND = [
    ('standard', 'Обычный'),
    ('strength', 'Силовой'),
    ('running',  'Беговой'),
]
