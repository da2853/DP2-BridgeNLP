from django.urls import path
from . import views
from .views import password_reset_request

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('check-auth/', views.check_auth, name='check_auth'),
    path('firebase-login/', views.firebase_login, name='firebase_login'),
    path('protected/', views.protected_view, name='protected_view'),
    path('password-reset-request/', password_reset_request, name='password_reset_request'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('google-login/', views.google_login, name='google_login'),
    path('chat/', views.chat, name='chat'),
    path('get_user_data/', views.get_user_data, name='get_user_data'),
    path('save_user_data/', views.save_user_data_api, name='save_user_data'),
    path('get_user_functions/', views.get_user_functions, name='get_user_functions'),
    path('save_user_function/', views.save_user_function, name='save_user_function'),
    path('toggle_function_visibility/', views.toggle_function_visibility, name='toggle_function_visibility'),
    path('get_public_functions/', views.get_public_functions, name='get_public_functions'),
    path('add_public_function_to_library/', views.add_public_function_to_library, name='add_public_function_to_library'),
    path('delete_user_function/', views.delete_user_function, name='delete_user_function'),
    path('get_response/', views.get_response, name='get_response'),
    path('repeat_execution/', views.repeat_execution, name='repeat_execution'),
    path('get_execution_history/', views.get_execution_history, name='get_execution_history'),

    
]