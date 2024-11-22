def init_qdrant_collection():
    try:
        collections = qdrant_client.get_collections().collections
        collection_names = [collection.name for collection in collections]
        
        if "function_descriptions" not in collection_names:
            qdrant_client.create_collection(
                collection_name="function_descriptions",
                vectors_config={
                    "size": 768,  
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

def save_function_description(function, userId, name, function_id=None):
    try:
        init_qdrant_collection()
        
        embeddings = GoogleGenerativeAIEmbeddings(
            google_api_key=GOOGLE_API_KEY,
            model="models/text-embedding-004"
        )
        
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
            "function_id": function_id,
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
        embeddings =await GoogleGenerativeAIEmbeddings(
            google_api_key=GOOGLE_API_KEY,
            model="models/text-embedding-004"
        )
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
                "function_id": result.payload.get("function_id"),
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
        embeddings = GoogleGenerativeAIEmbeddings(
            google_api_key=GOOGLE_API_KEY,
            model="models/text-embedding-004"
        )
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
                "function_id": result.payload.get("function_id"),
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
      
    

async def Aget_user_functions_firestore(user_id: str, function_id: str = None) -> List[Dict]:
    """
    Get functions saved by a user from Firestore. If function_id is provided, 
    fetch only that specific function.
    
    Args:
        user_id (str): The ID of the user whose functions to retrieve.
        function_id (str): The ID of the specific function to retrieve (optional).
        
    Returns:
        List[Dict]: List of dictionaries containing function data.
    """
    try:
        # Query the 'functions' collection filtered by 'userId'
        query = db.collection('functions').where('userId', '==', user_id)
        
        # If function_id is provided, retrieve the specific document directly
        if function_id:
            doc_ref = db.collection('functions').document(function_id)
            doc = await doc_ref.get()
            
            # Check if the document exists and belongs to the user
            if doc.exists and doc.to_dict().get('userId') == user_id:
                return [{'id': doc.id, **doc.to_dict()}]
            return []
        
        # If no specific function_id, stream all user's functions
        snapshot = await query.get()
        
        # Convert documents to list of dictionaries
        functions = [{'id': doc.id, **doc.to_dict()} for doc in snapshot]
        return functions
    
    except Exception as e:
        print(f"Error getting user functions: {str(e)}")
        return []

  
  
def get_user_functions_firestore(user_id: str,  function_id: str) -> List[Dict]:
    """
    Get functions saved by a user from Firestore. If function_id is provided, 
    fetch only that specific function.
    
    Args:
        user_id (str): The ID of the user whose functions to retrieve.
        function_id (str): The ID of the specific function to retrieve (optional).
        
    Returns:
        List[Dict]: List of dictionaries containing function data.
    """
    try:
        # Query the 'functions' collection filtered by 'userId'
        query = db.collection('functions').where('userId', '==', user_id)
        
        # If function_id is provided, retrieve the specific document directly
        if function_id:
            doc_ref = db.collection('functions').document(function_id)
            doc =  doc_ref.get()
            
            # Check if the document exists and belongs to the user
            if doc.exists and doc.to_dict().get('userId') == user_id:
                return [{'id': doc.id, **doc.to_dict()}]
            return []
        
        # If no specific function_id, stream all user's functions
        snapshot =  query.get()
        
        # Convert documents to list of dictionaries
        functions = [{'id': doc.id, **doc.to_dict()} for doc in snapshot]
        return functions
    
    except Exception as e:
        print(f"Error getting user functions: {str(e)}")
        return []
        
class getUserFunctionInput(BaseModel):
    user_id: str 
    function_id: str
  
       
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