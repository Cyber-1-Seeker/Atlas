from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MuscleGroupViewSet, ExerciseViewSet,
    TrainingProgramViewSet, TrainingDayViewSet,
    WorkoutSessionViewSet,
)

router = DefaultRouter()
router.register('muscles',   MuscleGroupViewSet,     basename='muscle')
router.register('exercises', ExerciseViewSet,         basename='exercise')
router.register('programs',  TrainingProgramViewSet,  basename='program')
router.register('days',      TrainingDayViewSet,      basename='day')
router.register('sessions',  WorkoutSessionViewSet,   basename='session')

urlpatterns = [path('', include(router.urls))]
