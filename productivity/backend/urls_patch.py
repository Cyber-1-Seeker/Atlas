"""
Добавить в конец config/urls.py:

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',     include('apps.users.urls')),
    path('api/12weeks/',  include('apps.twelve_weeks.urls')),
    path('api/progress/', include('apps.progress.urls')),
    path('api/life-wheel/',include('apps.life_wheel.urls')),
    path('api/board/',    include('apps.board.urls')),
    path('api/fitness/',  include('apps.fitness.urls')),
]

# ← Добавить эти строки (работает только при DEBUG=True):
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
"""
