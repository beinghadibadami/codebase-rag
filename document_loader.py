# ✅ FILE: document_loader.py
import os
import tempfile
import subprocess
from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document

# Supported file types for code loading
SUPPORTED_EXTENSIONS = [
    # Major languages
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".go", ".rs", ".php", ".rb", ".swift", ".kt", ".cs", ".vb",
    # Scripting
    ".sh", ".bat", ".pl", ".m", ".r", ".lua",
    # Web
    ".html", ".css", ".json", ".xml", ".yml", ".yaml",
    # Docs/Notebooks
    ".md", ".txt", ".ipynb",
    # Data/SQL
    ".sql",
]

# Directories to skip (common dependency/build/hidden folders)
SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "env", "venv", ".mypy_cache", ".pytest_cache", ".vscode", ".idea", ".next", "dist", "build", "out"
}

# Files to skip (dependency, lock, config, and build files)
SKIP_FILES = {
    "package-lock.json","package.json", "yarn.lock", "pnpm-lock.yaml", "requirements.txt", "poetry.lock", "Pipfile.lock", "pyproject.toml", "setup.py", "setup.cfg", "environment.yml", "Dockerfile"
}


def clone_repo(git_url):
    # Clone the GitHub repository to a temporary directory
    temp_dir = tempfile.mkdtemp()
    subprocess.run(["git", "clone", git_url, temp_dir], check=True)
    return temp_dir

def load_code_files(folder_path):
    # Load all supported files as LangChain Documents
    documents = []
    for root, dirs, files in os.walk(folder_path):
        # Remove unwanted directories in-place
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for file in files:
            if file in SKIP_FILES:
                continue
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

