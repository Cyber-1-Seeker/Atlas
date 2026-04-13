from django.db import models
from django.conf import settings

BODY_REGIONS = [
    ('chest', 'Грудь'), ('back', 'Спина'), ('shoulders', 'Плечи'),
    ('arms', 'Руки'), ('legs', 'Ноги'), ('core', 'Пресс/Кор'), ('other', 'Другое'),
]


class MuscleGroup(models.Model):
    key = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)
    body_region = models.CharField(max_length=50, choices=BODY_REGIONS, blank=True)
    emoji = models.CharField(max_length=10, blank=True, default='💪')
    image = models.ImageField(upload_to='muscles/', null=True, blank=True)
    description = models.TextField(blank=True, help_text='Что это за мышца, где находится')
    functions = models.TextField(blank=True, help_text='Что она делает анатомически')
    daily_life = models.TextField(blank=True, help_text='Где в жизни используется')
    benefits = models.TextField(blank=True, help_text='Зачем её развивать')
    posture_role = models.TextField(blank=True, help_text='Роль в осанке и здоровье')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['body_region', 'order', 'name']

    def __str__(self): return self.name


INTENSITY = [(1, 'Немного'), (2, 'Средне'), (3, 'Сильно'), (4, 'Очень сильно')]


class ExerciseMuscle(models.Model):
    exercise = models.ForeignKey('Exercise', on_delete=models.CASCADE, related_name='muscles')
    muscle = models.ForeignKey(MuscleGroup, on_delete=models.CASCADE)
    intensity = models.PositiveSmallIntegerField(choices=INTENSITY, default=2)

    class Meta:
        unique_together = ('exercise', 'muscle')


class Exercise(models.Model):
    CATEGORY = [
        ('chest', 'Грудь'), ('back', 'Спина'), ('shoulders', 'Плечи'),
        ('arms', 'Руки'), ('legs', 'Ноги'), ('core', 'Пресс/Кор'),
        ('cardio', 'Кардио'), ('other', 'Другое'),
    ]
    EQUIPMENT = [
        ('barbell', 'Штанга'), ('dumbbell', 'Гантели'), ('machine', 'Тренажёр'),
        ('cable', 'Блок'), ('bodyweight', 'Без оборудования'), ('other', 'Другое'),
    ]

    MEASUREMENT_TYPES = [
        ('strength', 'Силовой (кг × повторения)'),
        ('running', 'Беговой (м + время)'),
        ('reps', 'Повторения'),
        ('time', 'Время (сек)'),
        ('distance', 'Дистанция (м)'),
        ('standard', 'Произвольное число'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=30, choices=CATEGORY, default='other')
    equipment = models.CharField(max_length=30, choices=EQUIPMENT, default='other')
    measurement_type = models.CharField(max_length=20, choices=MEASUREMENT_TYPES, default='strength')
    emoji = models.CharField(max_length=10, blank=True, default='🏋️')
    description = models.TextField(blank=True)
    how_to = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    tips = models.TextField(blank=True)
    common_mistakes = models.TextField(blank=True)
    image = models.ImageField(upload_to='exercises/images/', null=True, blank=True)
    gif = models.FileField(upload_to='exercises/gifs/', null=True, blank=True)
    video_url = models.URLField(blank=True)
    extra_links = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self): return self.name


class TrainingProgram(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='programs')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    weeks_count = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self): return f'{self.name} ({self.user})'


class TrainingDay(models.Model):
    program = models.ForeignKey(TrainingProgram, on_delete=models.CASCADE, related_name='days')
    name = models.CharField(max_length=200)
    week_index = models.PositiveSmallIntegerField(default=0)
    day_index = models.PositiveSmallIntegerField(default=0)
    order = models.PositiveSmallIntegerField(default=0)
    rest_day = models.BooleanField(default=False)

    class Meta:
        ordering = ['week_index', 'order']


class DaySection(models.Model):
    day = models.ForeignKey(TrainingDay, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=100, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']


class DayExercise(models.Model):
    section = models.ForeignKey(DaySection, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    measurement_type = models.CharField(max_length=20, blank=True,
                                        help_text='Переопределяет тип из упражнения если задан')
    order = models.PositiveSmallIntegerField(default=0)
    sets_count = models.PositiveSmallIntegerField(default=3)
    reps_hint = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['order']


class WorkoutSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    day = models.ForeignKey(TrainingDay, on_delete=models.SET_NULL, null=True, related_name='sessions')
    date = models.DateField()
    started = models.DateTimeField(auto_now_add=True)
    ended = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-date', '-started']


class SessionSet(models.Model):
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='sets')
    day_exercise = models.ForeignKey(DayExercise, on_delete=models.CASCADE, related_name='sets')
    set_number = models.PositiveSmallIntegerField()
    weight = models.FloatField()
    reps = models.PositiveSmallIntegerField()
    orm = models.FloatField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['set_number']
