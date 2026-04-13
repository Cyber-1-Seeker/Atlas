from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView, ChangePasswordView,
    ExportUserDataView, ImportUserDataView,
)

urlpatterns = [
    path('register/',        RegisterView.as_view()),
    path('login/',           LoginView.as_view()),
    path('logout/',          LogoutView.as_view()),
    path('token/refresh/',   TokenRefreshView.as_view()),
    path('profile/',         ProfileView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('data/export/',     ExportUserDataView.as_view()),
    path('data/import/',     ImportUserDataView.as_view()),
]
