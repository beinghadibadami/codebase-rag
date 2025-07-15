# ✅ FILE: embed_store.py
import uuid
import os
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone, ServerlessSpec

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# Initialize embedding model
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Setup Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "chat-with-code"

# Create index if not exists
if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
index = pc.Index(index_name)

# Split large documents into chunks for better context retrieval
def chunk_documents(documents, chunk_size=500, chunk_overlap=50):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_documents(documents)

# Embed chunks and store vectors (with text in metadata) to Pinecone
def embed_and_store(chunks, namespace="default-session"):
    vectors = []
    for i, chunk in enumerate(chunks):
        chunk_id = f"{namespace}-{uuid.uuid4()}"
        text = chunk.page_content
        embedding = embedding_model.embed_query(text)

        vectors.append({
            "id": chunk_id,
            "values": embedding,
            "metadata": {
                "text": text
            }
        })
    index.upsert(vectors=vectors, namespace=namespace)

# Retrieve most relevant chunks based on query similarity
def retrieve_top_chunks(query, namespace="default-session", k=3):
    embedding = embedding_model.embed_query(query)
    results = index.query(vector=embedding, top_k=k, namespace=namespace, include_metadata=True)

    return [match["metadata"]["text"] for match in results["matches"]]
