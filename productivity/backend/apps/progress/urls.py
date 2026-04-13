from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgressCategoryViewSet, ProgressTrackerViewSet

router = DefaultRouter()
router.register('categories', ProgressCategoryViewSet, basename='category')
router.register('trackers',   ProgressTrackerViewSet,  basename='tracker')

urlpatterns = [path('', include(router.urls))]
