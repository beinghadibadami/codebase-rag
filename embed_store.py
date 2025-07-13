# ✅ FILE: embed_store.py
import redis
import uuid
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Initialize embedding model
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Initialize Pinecone and create index if not exists
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "chat-with-code"

if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
index = pc.Index(index_name)

# Connect to Redis
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

def chunk_documents(documents, chunk_size=500, chunk_overlap=50):
    # Split documents into overlapping chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_documents(documents)

def embed_and_store(chunks, namespace="default-session"):
    vectors = []
    for i, chunk in enumerate(chunks):
        chunk_id = f"{namespace}-{uuid.uuid4()}"
        text = chunk.page_content
        embedding = embedding_model.embed_query(text)
        # Store raw text in Redis using chunk_id
        redis_client.set(chunk_id, text)
        # Store vector in Pinecone
        vectors.append({
            "id": chunk_id,
            "values": embedding,
        })
    index.upsert(vectors=vectors, namespace=namespace)

def retrieve_top_chunks(query, namespace="default-session", k=3):
    # Generate embedding for user query
    embedding = embedding_model.embed_query(query)
    # Search top-k similar vectors in Pinecone
    results = index.query(vector=embedding, top_k=k, namespace=namespace)
    # Retrieve full text chunks from Redis
    return [redis_client.get(match["id"]).decode("utf-8") for match in results["matches"]]
