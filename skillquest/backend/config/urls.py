from django.urls import path, include
from rest_framework.routers import DefaultRouter
from skills.views import DirectionViewSet, BranchViewSet, CheckpointViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'directions', DirectionViewSet, basename='direction')
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'checkpoints', CheckpointViewSet, basename='checkpoint')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/', include('accounts.urls')),
]
