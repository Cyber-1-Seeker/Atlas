from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import group_views

urlpatterns = [
    # Auth
    path('register/',       views.RegisterView.as_view()),
    path('login/',          views.LoginView.as_view()),
    path('token/refresh/',  TokenRefreshView.as_view()),
    path('me/',             views.MeView.as_view()),
    # Progress
    path('progress/',                   views.ProgressView.as_view()),
    path('progress/complete-task/',     views.CompleteTaskView.as_view()),
    path('progress/complete-checkpoint/', views.CompleteCheckpointView.as_view()),
    path('progress/sync/',              views.SyncProgressView.as_view()),
    # Groups
    path('groups/',                     group_views.GroupListCreateView.as_view()),
    path('groups/join/',                group_views.JoinGroupView.as_view()),
    path('groups/<uuid:pk>/',           group_views.GroupDetailView.as_view()),
    path('groups/<uuid:pk>/leave/',     group_views.LeaveGroupView.as_view()),
    path('groups/<uuid:pk>/regenerate-invite/', group_views.RegenerateInviteView.as_view()),
]
