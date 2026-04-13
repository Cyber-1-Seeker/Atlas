from django.db import models
import uuid

ICON_CHOICES = [
    ('code','Code'),('brush','Brush'),('sword','Sword'),('brain','Brain'),
    ('star','Star'),('bolt','Bolt'),('trophy','Trophy'),('fire','Fire'),
    ('target','Target'),('book','Book'),('music','Music'),('camera','Camera'),
    ('globe','Globe'),('cpu','CPU'),('palette','Palette'),
]

class Direction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon_type = models.CharField(max_length=30, choices=ICON_CHOICES, default='star')
    description = models.TextField(blank=True)
    color_hex = models.CharField(max_length=7, default='#7c3aed')
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['order','name']
    def __str__(self): return self.name


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    direction = models.ForeignKey(Direction, on_delete=models.CASCADE, related_name='branches')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color_hex = models.CharField(max_length=7, default='#e8003d')
    order = models.IntegerField(default=0)
    is_hardcore = models.BooleanField(default=False)
    # Hardcore variant: if set, switching hardcore shows this branch instead
    hardcore_variant = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='normal_variant'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['order','title']
    def __str__(self): return f'{self.direction.name} → {self.title}'


class Checkpoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='checkpoints')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_type = models.CharField(max_length=30, choices=ICON_CHOICES, default='star')
    xp_reward = models.IntegerField(default=500)
    order = models.IntegerField(default=0)
    pos_x = models.IntegerField(default=200)
    pos_y = models.IntegerField(default=400)
    # ManyToMany prerequisites — multiple checkpoints can gate one node
    prerequisites = models.ManyToManyField(
        'self', blank=True, symmetrical=False, related_name='unlocks'
    )
    achievement_name = models.CharField(max_length=100, blank=True)
    achievement_description = models.TextField(blank=True)
    achievement_icon = models.CharField(max_length=10, blank=True, default='🏆')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['order']
    def __str__(self): return f'{self.branch.title} → {self.title}'


class Task(models.Model):
    DIFFICULTY = [(1,'Easy'),(2,'Medium'),(3,'Hard')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    checkpoint = models.ForeignKey(Checkpoint, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    content_md = models.TextField(blank=True)
    xp_reward = models.IntegerField(default=100)
    difficulty_rating = models.IntegerField(choices=DIFFICULTY, default=1)
    order = models.IntegerField(default=0)
    hardcore_xp_multiplier = models.FloatField(default=2.0)
    hardcore_description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['order']
    def __str__(self): return self.title
