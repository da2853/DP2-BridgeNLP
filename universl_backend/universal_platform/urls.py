from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# Add this simple health check view
def health_check(request):
    return HttpResponse("OK")

urlpatterns = [
    #   path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    # Add this new health check URL
    path('health/', health_check, name='health_check'),
]
