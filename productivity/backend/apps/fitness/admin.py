from django.contrib import admin
from .models import (MuscleGroup, Exercise, ExerciseMuscle,
                     TrainingProgram, TrainingDay, DaySection, DayExercise,
                     WorkoutSession, SessionSet)

class SuperuserOnly(admin.ModelAdmin):
    def has_add_permission(self, r):    return r.user.is_superuser
    def has_change_permission(self, r, obj=None): return r.user.is_superuser
    def has_delete_permission(self, r, obj=None): return r.user.is_superuser

@admin.register(MuscleGroup)
class MuscleGroupAdmin(SuperuserOnly):
    list_display = ('name','key','body_region','order')
    list_editable= ('order',)
    search_fields= ('name','key')
    fieldsets = (
        (None, {'fields':('key','name','name_en','body_region','emoji','image','order')}),
        ('Содержание', {'fields':('description','functions','daily_life','benefits','posture_role')}),
    )

class ExerciseMuscleInline(admin.TabularInline):
    model = ExerciseMuscle
    extra = 2
    autocomplete_fields = ['muscle']

@admin.register(Exercise)
class ExerciseAdmin(SuperuserOnly):
    list_display    = ('name','category','equipment','is_published','created_at')
    list_filter     = ('category','equipment','is_published')
    search_fields   = ('name',)
    list_editable   = ('is_published',)
    prepopulated_fields = {'slug':('name',)}
    inlines         = [ExerciseMuscleInline]
    fieldsets = (
        (None, {'fields':('name','slug','category','equipment','emoji','is_published')}),
        ('Медиа', {'fields':('image','gif','video_url','extra_links')}),
        ('Описание', {'fields':('description','how_to','benefits','tips','common_mistakes')}),
    )

@admin.register(TrainingProgram)
class TrainingProgramAdmin(admin.ModelAdmin):
    list_display = ('name','user','weeks_count','is_active','created_at')

@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ('user','day','date','started','ended')
