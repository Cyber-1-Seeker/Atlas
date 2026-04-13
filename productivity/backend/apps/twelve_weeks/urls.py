from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, TaskViewSet, AchievementDiaryEntryViewSet

router = DefaultRouter()
router.register('goals', GoalViewSet, basename='goal')
router.register('tasks', TaskViewSet, basename='task')
router.register('diary', AchievementDiaryEntryViewSet, basename='diary')

urlpatterns = [path('', include(router.urls))]
