# ✅ FILE: document_loader.py
import os
import tempfile
import subprocess
from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document

# Supported file types for code loading
SUPPORTED_EXTENSIONS = [".py", ".js", ".java", ".cpp", ".ts", ".ipynb", ".md", ".txt"]

def clone_repo(git_url):
    # Clone the GitHub repository to a temporary directory
    temp_dir = tempfile.mkdtemp()
    subprocess.run(["git", "clone", git_url, temp_dir], check=True)
    return temp_dir

def load_code_files(folder_path):
    # Load all supported files as LangChain Documents
    documents = []
    for root, _, files in os.walk(folder_path):
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext.lower() in SUPPORTED_EXTENSIONS:
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    documents.append(Document(page_content=content, metadata={"source": path}))
                except Exception as e:
                    print(f"Skipping {file}: {e}")
    return documents

