from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import uuid

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra):
        if not email:
            raise ValueError('Email required')
        user = self.model(username=username, email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=40, unique=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=60, blank=True)
    avatar_emoji = models.CharField(max_length=8, default='⚔')
    accent_color = models.CharField(max_length=7, default='#7c3aed')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    objects = UserManager()
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    @property
    def name(self):
        return self.display_name or self.username


class UserProgress(models.Model):
    """Stores which checkpoints and tasks a user has completed."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    checkpoint = models.ForeignKey(
        'skills.Checkpoint', on_delete=models.CASCADE, related_name='user_progress'
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'checkpoint')


class UserTaskProgress(models.Model):
    """Stores which individual tasks a user has completed."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_progress')
    task = models.ForeignKey(
        'skills.Task', on_delete=models.CASCADE, related_name='user_progress'
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'task')


import secrets

class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    emoji = models.CharField(max_length=8, default='⚔')
    color_hex = models.CharField(max_length=7, default='#7c3aed')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_groups')
    # Which direction this group is working on together
    direction = models.ForeignKey(
        'skills.Direction', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='groups'
    )
    invite_code = models.CharField(max_length=12, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = secrets.token_urlsafe(8)[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    ROLES = [('owner', 'Owner'), ('member', 'Member')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=ROLES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')
        ordering = ['joined_at']

    def __str__(self):
        return f'{self.user.username} in {self.group.name}'
