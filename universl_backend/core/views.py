from asgiref.sync import async_to_sync
from django.http import JsonResponse, HttpResponseServerError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from firebase_admin import auth as firebase_auth, firestore
from .firebase_auth import verify_firebase_token
import hashlib
from qdrant_client import QdrantClient, models
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain.schema import SystemMessage , AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate
from langchain.agents import AgentExecutor, create_tool_calling_agent 
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.tools import StructuredTool  
from typing import Dict, List, Optional
from langchain.tools import BaseTool
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI
import ast
import traceback
import sys
import io
import re
from langchain_openai import OpenAIEmbeddings



import os
import datetime
import uuid


load_dotenv()

GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
QDRANT_URL=os.getenv("QDRANT_URL")
QDRANT_API_KEY=os.getenv("QDRANT_API_KEY")
OPENAI_API_KEY= os.getenv("OPENAI_API_KEY")

qdrant_client = QdrantClient(
    url=QDRANT_URL, 
    api_key=QDRANT_API_KEY,
)
# embeddings = GoogleGenerativeAIEmbeddings(
#             google_api_key=GOOGLE_API_KEY,
#             model="models/text-embedding-004"
# )

# llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY, model='text-embedding-3-small')
llm = ChatOpenAI(api_key=OPENAI_API_KEY, model='gpt-4o-mini')

 
# Initialize Firestore client
db = firestore.client()

@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = json.loads(request.body)
    id_token = data.get('idToken')
    
    try:
        # Verify the id token to retrieve user information
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token['email']
        
        # Generate userId by hashing the email
        user_id = hashlib.sha256(email.encode()).hexdigest()
        
        # Extract firstName and lastName from email
        firstName = email.split('@')[0] or ""
        lastName = email.split('@')[1] or ""
        
        # Save initial user data to Firestore
        save_user_data(user_id, {'firstName': firstName, 'lastName': lastName, 'email': email})

        return JsonResponse({'success': True, 'message': 'User registered successfully', 'uid': user_id})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def user_login(request):
    print("Received login request")  
    data = json.loads(request.body)
    id_token = data.get('idToken')
    
    decoded_token = verify_firebase_token(id_token)
    if decoded_token:
        # Here you might want to create a session or generate a JWT
        return JsonResponse({'success': True, 'message': 'Login successful', 'uid': decoded_token['uid']})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)

@csrf_exempt
@require_http_methods(["POST"])
def user_logout(request):
    # Firebase handles token invalidation on the client-side
    # Here you would typically clear any server-side session if you're using one
    return JsonResponse({'success': True, 'message': 'Logout successful'})

@require_http_methods(["GET"])
def check_auth(request):
    id_token = request.headers.get('Authorization')
    if id_token:
        decoded_token = verify_firebase_token(id_token)
        if decoded_token:
            return JsonResponse({'success': True, 'message': 'Authentication valid', 'uid': decoded_token['uid']})
    return JsonResponse({'success': False, 'error': 'Authentication invalid'}, status=401)

@csrf_exempt
@require_http_methods(["POST"])
def firebase_login(request):
    # This is redundant with user_login, consider removing
    return user_login(request)

@require_http_methods(["GET"])
def protected_view(request):
    id_token = request.headers.get('Authorization')
    if id_token:
        decoded_token = verify_firebase_token(id_token)
        if decoded_token:
            return JsonResponse({'success': True, 'message': 'This is a protected view', 'uid': decoded_token['uid']})
    return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)

@csrf_exempt
@require_http_methods(["POST"])
def password_reset_request(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'success': False, 'message': 'Email is required'}, status=400)
        
        # # Send password reset email
        # send_password_reset_email(email)
        
        return JsonResponse({
            'success': True, 
            'message': 'Password reset email sent'
        })
    except firebase_auth.AuthError as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
    except Exception as e:
        print(f"Unexpected error in password_reset_request: {str(e)}")
        return HttpResponseServerError(json.dumps({'success': False, 'message': 'An unexpected error occurred'}), content_type='application/json')

@csrf_exempt
@require_http_methods(["POST"])
def password_reset_confirm(request):
    # This should be handled client-side with Firebase SDK
    return JsonResponse({'success': False, 'error': 'This operation should be handled client-side'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def google_login(request):
    # This should be the same as firebase_login and user_login
    return user_login(request)



##########################################################################################
# LOGIC FOR CHAT
##########################################################################################

@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    data = json.loads(request.body)
    user_message = data.get('message')

    if not user_message:
        return JsonResponse({'error': 'No message provided'}, status=400)

    try:
        # Process the message
        response = process_message(user_message)
        return JsonResponse(response)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def process_message(message):
    # Analyze the message to understand the user's intent
    intent = analyze_intent(message)

    # Perform vector search if needed
    search_results = perform_vector_search(message)

    # Determine the appropriate action based on intent and search results
    action = determine_action(intent, search_results)

    # Execute the determined action
    action_result = execute_action(action)

    # Generate a response based on the action result
    response = generate_response(action_result)

    return response

def analyze_intent(message):
    # Placeholder for intent analysis implementation
    print(f"Analyzing intent for: {message}")
    return {"intent": "Placeholder intent"}

def perform_vector_search(query):
    # Placeholder for vector search implementation
    print(f"Performing vector search for: {query}")
    return {"relevantInfo": "Placeholder relevant information"}

def determine_action(intent, search_results):
    # Placeholder for action determination logic
    print(f"Determining action for intent: {intent} and search results: {search_results}")
    return {"type": "placeholderAction", "params": {}}

def execute_action(action):
    # Placeholder for action execution implementation
    print(f"Executing action: {action}")
    return {"result": "Placeholder action result"}

def generate_response(action_result):
    # Placeholder for response generation logic
    print(f"Generating response for action result: {action_result}")
    return {"message": "Placeholder response message"}

def save_user_data(user_id, user_data):
    try:
        db.collection('users').document(user_id).set(user_data, merge=True)
        return True
    except Exception as e:
        print(f"Error saving user data: {str(e)}")
        return False

@csrf_exempt
@require_http_methods(["GET"])
def get_user_data(request):
    id_token = request.headers.get('Authorization')
    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    
    try:
        doc_ref = db.collection('users').document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            return JsonResponse({'success': True, 'data': doc.to_dict()})
        else:
            return JsonResponse({'success': False, 'error': 'User data not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

def init_qdrant_collection():
    try:
        collections = qdrant_client.get_collections().collections
        collection_names = [collection.name for collection in collections]
        
        if "function_descriptions" not in collection_names:
            qdrant_client.create_collection(
                collection_name="function_descriptions",
                vectors_config={
                    "size": 1536,  
                    "distance": "Cosine"
                }
            )
            
            qdrant_client.create_payload_index(
                collection_name="function_descriptions",
                field_name="userId",
                field_schema="keyword"
            )
            
            
        return True
    except Exception as e:
        print(f"Error initializing Qdrant collection: {str(e)}")
        return False

def find_existing_function(user_id, function_name):
    """
    Helper function to find existing function in Qdrant by userId and function_name
    """
    try:
        search_result = qdrant_client.scroll(
            collection_name="function_descriptions",
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="userId",
                        match={"value": user_id}
                    ),
                    models.FieldCondition(
                        key="function_name",
                        match={"value": function_name}
                    )
                ]
            ),
            limit=1
        )
        
        points = search_result[0]  
        if points:
            return points[0]  
        return None
    except Exception as e:
        print(f"Error finding existing function: {str(e)}")
        return None

def save_function_description(function, userId, name):
    try:
        init_qdrant_collection()
        
       
        
        function_text = function
        prompt = f"""Analyze this Python function and provide a clear, detailed description of:
        1. What the function does
        2. Its parameters and return values
        3. Any key logic or algorithms used
        
        Function:
        {function_text}
        """
        
        description = llm.invoke(prompt).content
        embedding_vector = embeddings.embed_query(description)
        
        existing_function = find_existing_function(userId, name)
        
        payload = {
            "description": description,
            "function_name": name,
            "userId": userId,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        if existing_function:
            point_id = existing_function.id
            qdrant_client.upsert(
                collection_name="function_descriptions",
                points=[{
                    "id": point_id,
                    "vector": embedding_vector,
                    "payload": payload
                }]
            )
        else:
            point_id = str(uuid.uuid4())
            qdrant_client.upsert(
                collection_name="function_descriptions",
                points=[{
                    "id": point_id,
                    "vector": embedding_vector,
                    "payload": payload
                }]
            )
        
        return {
            "success": True,
            "description": description,
            "id": point_id
        }
        
    except Exception as e:
        print(f"Error saving function description: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@csrf_exempt
@require_http_methods(["POST"])
def save_user_function(request):
    id_token = request.headers.get('Authorization')
    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    
    try:
        data = json.loads(request.body)
        function_id = data.get('functionId')
        
        function_data = {
            'userId': user_id,
            'name': data.get('name'),
            'description': data.get('description'),
            'code': data.get('code'),
            'language': data.get('language'),
            'isPublic': data.get('isPublic'),
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        if function_id:
            # Check if the function exists and belongs to the user
            doc_ref = db.collection('functions').document(function_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return JsonResponse({
                    'success': False,
                    'error': 'Function not found'
                }, status=404)
            
            if doc.to_dict().get('userId') != user_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Unauthorized to modify this function'
                }, status=403)
            
            # Update existing document
            doc_ref.update(function_data)
        else:
            # Create new document
            function_data['createdAt'] = firestore.SERVER_TIMESTAMP
            doc_ref = db.collection('functions').document()  # Generate new ID
            function_id = doc_ref.id  # Get the ID before saving
            doc_ref.set(function_data)  # Use set instead of add
        
        # Save function description
        res = save_function_description(data.get('code'), user_id, data.get('name'))
        
        return JsonResponse({
            'success': True,
            'message': 'Function saved successfully',
            'id': function_id
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON in request body'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    
    


@csrf_exempt
@require_http_methods(["GET"])
def get_user_functions(request):
    id_token = request.headers.get('Authorization')
    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    
    try:
        functions_ref = db.collection('functions').where('userId', '==', user_id)
        docs = functions_ref.stream()
        functions = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        return JsonResponse({'success': True, 'functions': functions})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    

def delete_function_from_qdrant(user_id, function_name):
    """
    Delete function vector from Qdrant
    Returns True if successful, False otherwise
    """
    try:
        existing_function = find_existing_function(user_id, function_name)
        
        if existing_function:
            qdrant_client.delete(
                collection_name="function_descriptions",
                points_selector=models.PointIdsList(
                    points=[existing_function.id]
                )
            )
            return True
        return False
    except Exception as e:
        print(f"Error deleting function from Qdrant: {str(e)}")
        return False

@csrf_exempt
@require_http_methods(["POST"])
def delete_user_function(request):
    """
    Delete a function and its associated vector from both Firebase and Qdrant
    """
    id_token = request.headers.get('Authorization')

    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    
    data = json.loads(request.body)
    function_id = data.get('functionId')
    
    try:
        doc_ref = db.collection('functions').document(function_id)
        function_doc = doc_ref.get()
        
        if not function_doc.exists:
            return JsonResponse({
                'success': False,
                'error': 'Function not found'
            }, status=404)
        
        function_data = function_doc.to_dict()
        if function_data.get('userId') != user_id:
            return JsonResponse({
                'success': False,
                'error': 'Unauthorized to delete this function'
            }, status=403)
        
        qdrant_deleted = delete_function_from_qdrant(
            user_id=user_id,
            function_name=function_data.get('name')
        )
        
        doc_ref.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Function deleted successfully',
            'qdrant_deleted': qdrant_deleted
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def save_user_data_api(request):
    data = json.loads(request.body)
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    id_token = request.headers.get('Authorization')
    try:
        if not id_token:
            return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
        
        decoded_token = verify_firebase_token(id_token)
        if not decoded_token:
            return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
        
        user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
        print(f"Saving user data for {user_id}")
        
        save_user_data(user_id,{'firstName': firstName, 'lastName': lastName, 'email': decoded_token['email']})
        return JsonResponse({'success': True, 'message': 'User data saved successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
    

@csrf_exempt
@require_http_methods(["POST"])
def toggle_function_visibility(request):
    id_token = request.headers.get('Authorization')
    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    
    data = json.loads(request.body)
    function_id = data.get('functionId')
    
    if not function_id:
        return JsonResponse({'success': False, 'error': 'Function ID is required'}, status=400)
    
    try:
        # Get the function document
        function_ref = db.collection('functions').document(function_id)
        function_doc = function_ref.get()
        
        if not function_doc.exists:
            return JsonResponse({'success': False, 'error': 'Function not found'}, status=404)
        
        function_data = function_doc.to_dict()
        
        # Check if the function belongs to the user
        if function_data['userId'] != user_id:
            return JsonResponse({'success': False, 'error': 'Unauthorized to modify this function'}, status=403)
        
        # Toggle the isPublic field
        new_visibility = not function_data.get('isPublic', False)
        
        # Update the function document
        function_ref.update({'isPublic': new_visibility})
        
        return JsonResponse({
            'success': True, 
            'message': f"Function visibility updated to {'public' if new_visibility else 'private'}",
            'isPublic': new_visibility
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    
@csrf_exempt
@require_http_methods(["GET"])
def get_public_functions(request):
    try:
        # Query for all public functions
        public_functions_ref = db.collection('functions').where('isPublic', '==', True)
        docs = public_functions_ref.stream()
        
        # Convert the document data to a list of dictionaries
        public_functions = []
        for doc in docs:
            function_data = doc.to_dict()
            function_data['id'] = doc.id  # Add the document ID to the function data
            public_functions.append(function_data)
        
        return JsonResponse({'success': True, 'functions': public_functions})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@csrf_exempt
@require_http_methods(["POST"])
@csrf_exempt
@require_http_methods(["POST"])
def add_public_function_to_library(request):
    id_token = request.headers.get('Authorization')
    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    
    data = json.loads(request.body)
    function_id = data.get('functionId')
    
    if not function_id:
        return JsonResponse({'success': False, 'error': 'Function ID is required'}, status=400)
    
    try:
        # Get the public function
        function_ref = db.collection('functions').document(function_id)
        function_doc = function_ref.get()
        
        if not function_doc.exists:
            return JsonResponse({'success': False, 'error': 'Function not found'}, status=404)
        
        function_data = function_doc.to_dict()
        
        # Check if the function is public
        if not function_data.get('isPublic', False):
            return JsonResponse({'success': False, 'error': 'This function is not public'}, status=403)
        
        # Check if the function belongs to the current user
        if function_data['userId'] == user_id:
            return JsonResponse({'success': False, 'error': 'You cannot add your own function to your library'}, status=400)
        
        # Check if the function is already in the user's library
        existing_function = db.collection('functions').where('userId', '==', user_id).where('originalFunctionId', '==', function_id).limit(1).get()
        
        if len(existing_function) > 0:
            return JsonResponse({'success': False, 'error': 'This function is already in your library'}, status=400)
        
        # Create a new function document for the user
        new_function_data = {
            'userId': user_id,
            'name': function_data['name'],
            'description': function_data['description'],
            'code': function_data['code'],
            'language': function_data['language'],
            'isPublic': False,  # Set to private by default when adding to user's library
            'createdAt': firestore.SERVER_TIMESTAMP,
            'originalFunctionId': function_id  # Reference to the original function
        }
        
        # Add the function to the user's library
        new_function_ref = db.collection('functions').add(new_function_data)
        
        return JsonResponse({
            'success': True, 
            'message': 'Function added to your library',
            'newFunctionId': new_function_ref[1].id
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


class VectorSearchInput(BaseModel):
    user_id: str 
    query: str 
    limit: int 
  
        
async def Asearch_vector_store(user_id: str, query: str, limit: int = 5) -> Dict:
    """
    Search the Qdrant vector store for functions matching the query, filtered by user_id
    
    Args:
        user_id: The ID of the user whose functions to search
        query: The search query or description of the function to find
        limit: Maximum number of results to return
        
    Returns:
        Dict containing search results and status
    """
    try:
        # Generate embeddings for the search query
        query_vector = embeddings.embed_query(query)
        
        # Search Qdrant with user_id filter
        search_results =await qdrant_client.search(
            collection_name="function_descriptions",
            query_vector=query_vector,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="userId",
                        match={"value": user_id}
                    )
                ]
            ),
            limit=limit
        )
        
        # Format results
        formatted_results = []
        for result in search_results:
            formatted_results.append({
                "function_name": result.payload.get("function_name"),
                "description": result.payload.get("description"),
                "score": result.score,
                "timestamp": result.payload.get("timestamp")
            })
            
        return {
            "success": True,
            "results": formatted_results,
            "count": len(formatted_results)
        }
        
    except Exception as e:
        print(f"Error in vector search: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "results": []
        }
       

def search_vector_store(user_id: str, query: str, limit: int = 5) -> Dict:
    """
    Search the Qdrant vector store for functions matching the query, filtered by user_id
    
    Args:
        user_id: The ID of the user whose functions to search
        query: The search query or description of the function to find
        limit: Maximum number of results to return
        
    Returns:
        Dict containing search results and status
    """
    try:
        # Generate embeddings for the search query
        query_vector = embeddings.embed_query(query)
        
        # Search Qdrant with user_id filter
        search_results = qdrant_client.search(
            collection_name="function_descriptions",
            query_vector=query_vector,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="userId",
                        match={"value": user_id}
                    )
                ]
            ),
            limit=limit
        )
        
        # Format results
        formatted_results = []
        for result in search_results:
            formatted_results.append({
                "function_name": result.payload.get("function_name"),
                "description": result.payload.get("description"),
                "score": result.score,
                "timestamp": result.payload.get("timestamp")
            })
            
        return {
            "success": True,
            "results": formatted_results,
            "count": len(formatted_results)
        }
        
    except Exception as e:
        print(f"Error in vector search: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "results": []
        }
      
    
async def Aget_user_functions_firestore(user_id: str) -> List[Dict]:
    """
    Get all functions saved by a user from Firestore
    
    Args:
        user_id: The ID of the user whose functions to retrieve
        
    Returns:
        List of dictionaries containing function data
    """
    try:
        functions_ref =await db.collection('functions').where('userId', '==', user_id)
        docs = functions_ref.stream()
        functions = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        return functions
    except Exception as e:
        print(f"Error getting user functions: {str(e)}")
        return []  
  
  
def get_user_functions_firestore(user_id: str) -> List[Dict]:
    """
    Get all functions saved by a user from Firestore
    
    Args:
        user_id: The ID of the user whose functions to retrieve
        
    Returns:
        List of dictionaries containing function data
    """
    try:
        functions_ref = db.collection('functions').where('userId', '==', user_id)
        docs = functions_ref.stream()
        functions = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        return functions
    except Exception as e:
        print(f"Error getting user functions: {str(e)}")
        return []  
  
        
class getUserFunctionInput(BaseModel):
    user_id: str 
  
       
get_user_functions_firestore_tool = StructuredTool.from_function(
    name= "get_user_functions_firestore",
    description= "Get all functions saved by a user from Firestore",
    func=get_user_functions_firestore,
    args_schema=getUserFunctionInput,
    coroutine=Aget_user_functions_firestore
)


search_vector_store_tool= StructuredTool.from_function(
    name= "search_vector_store",
    description= "Search for functions in the user's library using semantic searchUse this when you need to- Find functions matching a user's description- Check if a specific function exists in the user's librar- Find similar functions to what the user is asking about",
    func=search_vector_store,
    args_schema=VectorSearchInput,
    coroutine=Asearch_vector_store
)
# Define system instructions


SYSTEM_INSTRUCTIONS = """You are an AI assistant specialized in managing and executing users' custom Python functions stored in their personal library. Your primary responsibilities are:

1. FUNCTION DISCOVERY:
- Use search_vector_store to semantically search through the user's function library
- When users ask about function availability or capabilities or something which might need to run the function, always search their library first
- Match user requests with the most relevant stored functions based on semantic similarity

2. FUNCTION MANAGEMENT:
- Help users understand what functions they have available
- Provide function descriptions and details when requested
- Explain function capabilities and requirements

3. FUNCTION EXECUTION WORKFLOW:
a) Search Phase:
   - Use search_vector_store to find relevant functions (parameters: user_id, query, limit)
   - Analyze search results to identify the most appropriate function
   - If no matching function is found, clearly inform the user

b) Retrieval Phase:
   - Use get_user_functions_firestore to get full function details
   - Verify function parameters and requirements

c) Execution Phase:
   - Use python_repl to execute functions with proper parameters
   - Format function calls correctly, including full function definition and execution call
   Example format:
   ```python
   def function_name(param1, param2):
       # function body
       return result
   
   function_name(value1, value2)
   ```
d) Saving Execution History:
    - Use save_function_history to save function execution details to Firestore
    - Always call this function after executing a user's function. It is very Importnat. The user does not have to know about this function.
    -Do not run this function if the user has not executed a function or if the function execution fails or they result from the python_repl tool is still pending.
    Arguments:function_name, parameters, result, user_id, status
    

4. INTERACTION GUIDELINES:
- Always confirm function existence before attempting execution
- Request missing parameters clearly and specifically
- Provide clear feedback about execution results or errors
- Avoid executing functions multiple times unless explicitly requested
- If a user's request is ambiguous, ask for clarification about which function they want to use
- Never tell the user that you have his user_id

5. ERROR HANDLING:
- Search errors: Inform user of search failures and suggest alternatives
- Parameter errors: Clearly explain what parameters are needed
- Execution errors: Provide clear error explanations and potential solutions
- Security: Never execute code that appears unsafe or unauthorized

6. RESPONSE STRUCTURE:
- Function Search: Report relevant functions found
- Function Details: Show function description and requirements when needed
- Execution Results: Display clean, formatted output
- Error Messages: Provide clear, actionable error information
"""



chat_history = []

def get_or_create_chat_history(user_id: str) -> ChatMessageHistory:
    """Get or create a chat history for a user"""
    if user_id not in conversation_histories:
        conversation_histories[user_id] = ChatMessageHistory()
    return conversation_histories[user_id]


# Create a chat prompt template


CHAT_PROMPT = ChatPromptTemplate.from_messages([
    SystemMessage(content=SYSTEM_INSTRUCTIONS),
    MessagesPlaceholder(variable_name="chat_history"),
    HumanMessagePromptTemplate.from_template("{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

conversation_histories = {}


class CodeInput(BaseModel):
    code: str = Field(..., title="Python code", description="Input Python code to execute")

async def save_function_history(user_id: str, function_name: str, description: str, input_params: Dict, output: str) -> None:
    """
    Save function execution history to Firestore
    
    Args:
        user_id: The ID of the user
        function_name: Name of the executed function
        description: Description of what the function does
        input_params: Parameters passed to the function
        output: Function execution output
    """
    try:
        history_ref = db.collection('function_history').document()
        await history_ref.set({
            'userId': user_id,
            'functionName': function_name,
            'description': description,
            'inputParams': input_params,
            'output': output,
            'timestamp': datetime.now(),
        })
    except Exception as e:
        print(f"Error saving function history: {str(e)}")


class PythonREPLTool(BaseTool):
    name: str = Field(default="python_repl")
    description: str = Field(default="""A Python interpreter. Use this to execute Python code and get the output.
    Input should be a valid Python code string. Output will be the execution result or error message.
    Handle the output accordingly as it may contain printed output and/or the last evaluated expression.
    """)
    args_schema: type[BaseModel] = CodeInput
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._globals = {}
        self._locals = {}
        
        # Handle builtins properly
        if hasattr(__builtins__, '__dict__'):
            self._globals.update(__builtins__.__dict__)
        elif isinstance(__builtins__, dict):
            self._globals.update(__builtins__)
        
        safe_imports = {
            'requests': 'requests',
            'json': 'json',
            'datetime': 'datetime',
            'math': 'math',
            'random': 'random',
            'time': 'time',
            're': 're',
            'collections': 'collections',
            'itertools': 'itertools',
            'functools': 'functools',
            'typing': 'typing',
            'pandas': 'pandas',
            'numpy': 'np'
        }
        
        for module_name, import_as in safe_imports.items():
            try:
                self._globals[import_as] = __import__(module_name)
            except ImportError:
                print(f"Warning: Could not import {module_name}")

    def _sanitize_code(self, code: str) -> str:
        """Disabled sanitization for now"""
        return code
    
    def _run(self, code: str) -> str:
        """Execute Python code and return the result"""
        code = self._sanitize_code(code)
        
        # Capture stdout
        old_stdout = sys.stdout
        redirected_output = sys.stdout = io.StringIO()
        
        try:
            # Execute the code in a single compile/exec call to maintain context
            compiled_code = compile(code, '<string>', 'exec')
            exec(compiled_code, self._globals, self._locals)
            
            # Get printed output
            printed_output = redirected_output.getvalue()
            
            # Get the last expression's value if it exists
            last_value = None
            try:
                tree = ast.parse(code)
                last_node = tree.body[-1] if tree.body else None
                if isinstance(last_node, ast.Expr):
                    last_value = eval(compile(ast.Expression(body=last_node.value),
                                           '<string>', 'eval'),
                                    self._globals, self._locals)
            except:
                pass
            
            # Construct the response
            if printed_output and last_value is not None:
                return f"{printed_output.rstrip()}\nResult: {str(last_value)}"
            elif printed_output:
                return printed_output.rstrip()
            elif last_value is not None:
                return str(last_value)
            else:
                return ""
                
        except Exception as e:
            return f"Error: {str(e)}\n{traceback.format_exc()}"
            
        finally:
            sys.stdout = old_stdout
    
            
    def _arun(self, code: str) -> str:
        """Async version of _run"""
        raise NotImplementedError("PythonREPLTool does not support async execution")
    


class PythonREPLTool2(BaseTool):
    name: str = Field(default="python_repl")
    description: str = Field(default="""A Python interpreter. Use this to execute Python code and get the output.
    Input should be a valid Python code string. Output will be the execution result or error message.
    Handle the output accordingly as it may contain printed output and/or the last evaluated expression.
    """)
    args_schema: type[BaseModel] = CodeInput
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._globals = {}
        self._locals = {}
    
    def _sanitize_code(self, code: str) -> str:
        """Clean and normalize the code string"""
        code = code.replace('\\n', '\n')
        code = code.strip("'\"")
        code = code.replace('\r\n', '\n')
        return code
    def _is_safe_code(self, code: str) -> bool:
        """Security check for potentially harmful operations using an allowlist approach"""
        
        # Allowlist of safe modules and their safe functions
        SAFE_MODULES = {
            'requests': True,  # Allow HTTP requests
            'json': True,
            'datetime': True,
            'math': True,
            'random': True,
            'time': True,
            're': True,
            'collections': True,
            'itertools': True,
            'functools': True,
            'typing': True,
            'pandas': True,
            'numpy': True,            
        }
        
        # Explicitly dangerous operations
        DANGEROUS_OPERATIONS = {
            'eval', 'exec', 'compile',
            'subprocess', 'system', 'popen',
            '__import__', 'globals', 'locals',
            'breakpoint', 'input'
        }
        
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                # Check for dangerous built-in functions
                if isinstance(node, ast.Name) and node.id in DANGEROUS_OPERATIONS:
                    return False
                    
                # Check imports
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    for name in node.names:
                        module = name.name.split('.')[0]  # Get base module name
                        if module not in SAFE_MODULES:
                            # If module isn't in allowlist, block it
                            return False
                            
                # Block file operations except when part of allowed modules
                if isinstance(node, ast.Attribute):
                    if node.attr == 'open' and not isinstance(node.value, ast.Name):
                        return False
                        
            return True
        except Exception as e:
            print(f"Error in code safety check: {str(e)}")
            return False
            
    def _run(self, code: str) -> str:
        """Execute Python code and return the result"""
        print("Code:", code)
       
        # Capture stdout
        old_stdout = sys.stdout
        redirected_output = sys.stdout = io.StringIO()
        
        try:
            # Execute the code
            exec_globals = self._globals  # Use instance variables
            exec_locals = self._locals    # Use instance variables
            
            result = None
            
            try:
                # Parse the code into an AST
                tree = ast.parse(code)
                
                # Handle each statement
                for i, node in enumerate(tree.body):
                    if i == len(tree.body) - 1 and isinstance(node, ast.Expr):
                        # Last statement is an expression - evaluate it
                        exec(compile(ast.Module(body=tree.body[:i], type_ignores=[]), 
                                   filename="<ast>", mode="exec"), 
                             exec_globals, exec_locals)
                        result = eval(compile(ast.Expression(body=node.value),
                                           filename="<ast>", mode="eval"),
                                    exec_globals, exec_locals)
                    else:
                        # Execute the statement
                        exec(compile(ast.Module(body=[node], type_ignores=[]),
                                   filename="<ast>", mode="exec"),
                             exec_globals, exec_locals)
                
            except SyntaxError as e:
                return f"Syntax Error: {str(e)}"
            
            # Update instance variables
            self._globals = exec_globals
            self._locals = exec_locals
            
            # Get printed output
            printed_output = redirected_output.getvalue()
            
            # Construct the response
            if printed_output and result is not None:
                return f"{printed_output.rstrip()}\nResult: {str(result)}"
            elif printed_output:
                return printed_output.rstrip()
            elif result is not None:
                return str(result)
            else:
                return ""  # Return empty string instead of "Code executed successfully"
                
        except Exception as e:
            return f"Error: {str(e)}\n{traceback.format_exc()}"
            
        finally:
            sys.stdout = old_stdout
    
    
class FormatInput(BaseModel):
    response: str = Field(..., description="The response to format")

class ResponseFormatterTool(BaseTool):
    name: str = "response_formatter"
    description: str = "Formats the final response to show only relevant output"
    args_schema: type[BaseModel] = FormatInput
    
    def _run(self, response: str) -> str:
        """Format the response to show only relevant output"""
        try:
            # Check if this is a function execution response
            if "[Search Result]:" in response and "[Execution]:" in response:
                # Extract just the execution result
                execution_pattern = r'\[Execution\]:(.*?)(?:\[Next Steps\]:|$)'
                execution_match = re.search(execution_pattern, response, re.DOTALL)
                
                if execution_match:
                    result = execution_match.group(1).strip()
                    # Clean up the result if it's just a value
                    try:
                        # Try to evaluate if it's a literal (list, dict, etc.)
                        cleaned_result = eval(result)
                        return str(cleaned_result)
                    except:
                        # If not a literal, return as is
                        return result
                return response  # Return original if pattern not found
            else:
                # For regular text responses, return as is
                return response
        except Exception as e:
            return f"Error formatting response: {str(e)}"
                
    def _arun(self, response: str) -> str:
        """Async version of _run"""
        raise NotImplementedError("ResponseFormatterTool does not support async execution")


response_formatter_tool = ResponseFormatterTool()


class FunctionExecution(BaseModel):
    function_name: str = Field(..., description="Name of the function being executed")
    parameters: str = Field(
        default={}, 
        description="Parameters passed to the function as a dictionary"
    )
    code: str = Field(..., description="Python code of the function being executed")
    result: str = Field(..., description="Result of the function execution")
    user_id: str = Field(..., description="ID of the user executing the function")
    status: str = Field(
        default='success',
        description="Status of the execution - 'success' or 'error'"
    )
    
def save_function_execution(function_name: str, parameters: str,code:str, result: str, user_id: str, status: str = 'success') -> str:
    """Save function execution details to Firestore"""
    try:
        execution_ref = db.collection('function_executions').document()
        execution_data = {
            'execution_id': execution_ref.id,  # Generated by Firestore
            'function_name': function_name,
            'parameters': parameters,
            'timestamp': datetime.datetime.now(),
            'result': result,
            'user_id': user_id,
            'code': code,
            'status': status
        }
        execution_ref.set(execution_data)
        return execution_ref.id
    except Exception as e:
        print(f"Error saving function execution: {str(e)}")
        return None

async def Asave_function_execution(function_name: str, parameters: str,code:str, result: str, user_id: str, status: str = 'success') -> str:
    """Save function execution details to Firestore"""
    try:
        execution_ref = await db.collection('function_executions').document()
        execution_data = {
            'execution_id': execution_ref.id,  # Generated by Firestore
            'function_name': function_name,
            'parameters': parameters,
            'timestamp': datetime.now(),
            'result': result,
            'user_id': user_id,
             'code': code,
            'status': status
        }
        await execution_ref.set(execution_data)  # Added await here
        return execution_ref.id
    except Exception as e:
        print(f"Error saving function execution: {str(e)}")
        return None

save_function_execution_tool = StructuredTool.from_function(
    name="save_function_execution",
    description="""Save function execution details to Firestore""",
    func=save_function_execution,
    args_schema=FunctionExecution,
    coroutine=Asave_function_execution
)


     
@csrf_exempt
@require_http_methods(["GET"])
def get_execution_history(request):
    id_token = request.headers.get('Authorization')
    if not id_token:
        return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
    
    user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
    print(f"Getting execution history for {user_id}")
    
    try:
        executions_ref = db.collection('function_executions').filter(
            'user_id', '==', user_id
        )
        
        docs = executions_ref.stream()
        executions = []
        for doc in docs:
            data = doc.to_dict()
            data['timestamp'] = data['timestamp'].isoformat()
            executions.append(data)
            
        return JsonResponse({'success': True, 'executions': executions})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def repeat_execution(request):
    try:
        print("Starting repeat_execution function")  # Debug log
       
        data = json.loads(request.body)
        execution_id = data.get('execution_id')
        if not execution_id:
            return JsonResponse({
                'success': False,
                'error': 'Execution ID is required'
            }, status=400)
      
        print(f"Received execution_id: {execution_id}")  # Debug log

        # Verify authentication
        id_token = request.headers.get('Authorization')
        if not id_token:
            return JsonResponse({
                'success': False,
                'error': 'No token provided'
            }, status=401)

        # Fetch execution document
        print("Fetching execution document")  # Debug log
        execution_doc = db.collection('function_executions').document(execution_id).get()
        if not execution_doc.exists:
            return JsonResponse({
                'success': False,
                'error': 'Execution not found'
            }, status=404)
        
        # Get execution data
        execution_data = execution_doc.to_dict()
        print(f"Retrieved execution data: {execution_data}")  # Debug log
        
        if not execution_data.get('code'):
            return JsonResponse({
                'success': False,
                'error': 'No code found for this execution'
            }, status=400)
            
        try:
            print("Creating PythonREPLTool2 instance")  # Debug log
            repl_tool = PythonREPLTool2()
            
            # Wrap the _run call in a try-except with more detailed error handling
            try:
                print(f"Attempting to execute code: {execution_data['code'][:100]}...")  # Debug log (first 100 chars)
                result = repl_tool._run(execution_data['code'])
                print(f"Code execution result: {result}")  # Debug log
            except Exception as exec_error:
                print(f"Error in _run execution: {str(exec_error)}")  # Debug log
                return JsonResponse({
                    'success': False,
                    'error': f'Code execution error: {str(exec_error)}',
                    'traceback': traceback.format_exc()
                }, status=500)
                
        except Exception as tool_error:
            print(f"Error creating/using REPL tool: {str(tool_error)}")  # Debug log
            return JsonResponse({
                'success': False,
                'error': f'REPL tool error: {str(tool_error)}',
                'traceback': traceback.format_exc()
            }, status=500)

        # Save new execution
        try:
            print("Saving new execution")  # Debug log
            new_execution_id = save_function_execution(
                user_id=execution_data['user_id'],
                function_name=execution_data['function_name'],
                parameters=execution_data.get('parameters', {}),
                code=execution_data['code'],
                result=str(result)
            )
            print(f"New execution saved with ID: {new_execution_id}")  # Debug log
        except Exception as save_error:
            print(f"Error saving execution: {str(save_error)}")  # Debug log
            return JsonResponse({
                'success': False,
                'error': f'Error saving execution: {str(save_error)}',
                'traceback': traceback.format_exc()
            }, status=500)
            
        # Return success response
        return JsonResponse({
            'success': True,
            'result': str(result),
            'execution_id': new_execution_id
        })

    except Exception as e:
        print(f"Unexpected error in repeat_execution: {str(e)}")  # Debug log
        return JsonResponse({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'traceback': traceback.format_exc()
        }, status=500)
        

@csrf_exempt
@require_http_methods(["POST"])
def get_response(request):
    try:
        # Add detailed logging
        print("Starting get_response function")
        
        data = json.loads(request.body)
        user_message = data.get('message')
        id_token = request.headers.get('Authorization')
        
        print(f"Received message: {user_message}")
        
        if not id_token:
            return JsonResponse({'success': False, 'error': 'No token provided'}, status=401)
    
        try:
            decoded_token = verify_firebase_token(id_token)
            if not decoded_token:
                return JsonResponse({'success': False, 'error': 'Invalid token'}, status=401)
        except Exception as auth_error:
            print(f"Authentication error: {str(auth_error)}")
            return JsonResponse({'success': False, 'error': f'Authentication error: {str(auth_error)}'}, status=401)
    
        user_id = hashlib.sha256(decoded_token['email'].encode()).hexdigest()
        print(f"User ID: {user_id}")

        try:
            # Get or create chat history for this user
            chat_history = get_or_create_chat_history(user_id)
            print("Chat history retrieved")
            
            # Add user message to history
            chat_history.add_user_message(user_message)
            print("User message added to history")

            # Create agent with tools
            tools = [search_vector_store_tool, get_user_functions_firestore_tool, PythonREPLTool(), save_function_execution_tool]
            print("Tools initialized")
            
            agent = create_tool_calling_agent(llm=llm, tools=tools, prompt=CHAT_PROMPT)
            print("Agent created")
            
            agent_executor = AgentExecutor(
                agent=agent,
                tools=tools,
                verbose=True,
            )
            print("Agent executor created")
            
            user_message = user_message.strip() + "\nuser_id: {}".format(user_id)
            
            # Get response from agent
            print("Invoking agent")
            response = agent_executor.invoke({
                "input": user_message,
                "chat_history": chat_history.messages  
            })
            print(f"Agent response received: {response}")
            
            formatted_response = response_formatter_tool._run(response['output'])
            print(f"Response formatted: {formatted_response}")
            
            # Add AI response to history
            chat_history.add_ai_message(formatted_response)
            print("AI response added to history")
            
            # Clean old conversations if needed
            if len(conversation_histories) > 1000:
                clean_old_conversations()

            return JsonResponse({
                'status': 'success',
                'response': formatted_response,
                'user_id': user_id
            })

        except Exception as processing_error:
            print(f"Error processing message: {str(processing_error)}")
            print(f"Traceback: {traceback.format_exc()}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error processing message: {str(processing_error)}',
                'traceback': traceback.format_exc()
            }, status=500)

    except json.JSONDecodeError as json_error:
        print(f"JSON decode error: {str(json_error)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Invalid JSON: {str(json_error)}'
        }, status=400)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}',
            'traceback': traceback.format_exc()
        }, status=500)

def clean_old_conversations():
    """Remove old conversation histories to prevent memory issues"""
    try:
        current_time = datetime.datetime.now()
        max_age = datetime.timedelta(hours=240)  
        
        users_to_remove = []
        for user_id, history in conversation_histories.items():
            # Check if history has messages
            if history.messages:
                # Get timestamp of last message
                last_message_time = getattr(history.messages[-1], 'timestamp', None)
                if last_message_time and (current_time - last_message_time) > max_age:
                    users_to_remove.append(user_id)
            else:
                # Remove empty histories
                users_to_remove.append(user_id)
                
        # Remove identified histories
        for user_id in users_to_remove:
            del conversation_histories[user_id]
            
    except Exception as e:
        print(f"Error cleaning conversations: {str(e)}")

