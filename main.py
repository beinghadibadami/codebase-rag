# ✅ FILE: main.py (FastAPI backend entry)
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil, tempfile, os, uuid
from typing import List

from document_loader import clone_repo, load_code_files
from embed_store import chunk_documents, embed_and_store, retrieve_top_chunks
from query_llm import ask_llm

app = FastAPI()

# CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# UPLOAD_DIR = "temp_uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# Session-wise namespace to store embeddings separately
current_namespace = str(uuid.uuid4())

class QueryRequest(BaseModel):
    message: str

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/upload-file")
async def upload_files(files: List[UploadFile] = File(...)):
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    print(f"Saving uploaded files to temp folder: {temp_dir}")

    try:
        # Save uploaded files into the temp folder
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as f:
                contents = await file.read()
                f.write(contents)

        # Load & process the code files
        documents = load_code_files(temp_dir)
        if not documents:
            raise HTTPException(status_code=400, detail="No valid code files found.")

        chunks = chunk_documents(documents)
        embed_and_store(chunks, namespace=current_namespace)

        return {"message": f"✅ Processed {len(chunks)} chunks from uploaded files."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up temporary folder after processing
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/upload-github")
async def upload_github(repo_url: str = Form(...)):
    try:
        folder = clone_repo(repo_url)
        documents = load_code_files(folder)
        chunks = chunk_documents(documents)
        embed_and_store(chunks, namespace=current_namespace)

        return JSONResponse({"success": True, "message": "Repository processed"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: QueryRequest):
    try:
        chunks = retrieve_top_chunks(request.message, namespace=current_namespace)
        context = "\n\n".join(chunks)
        response = ask_llm(context, request.message)
        return JSONResponse({"success": True, "response": response})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
