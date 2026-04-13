from django.contrib import admin
from .models import Goal, Task

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('text', 'user', 'done', 'created_at')
    list_filter  = ('done',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('text', 'user', 'type', 'week', 'day_of_week', 'done')
    list_filter  = ('type', 'done', 'week')
