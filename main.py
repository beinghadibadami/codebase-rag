# ✅ FILE: main.py
# import sys
from document_loader import clone_repo, load_code_files
from embed_store import chunk_documents, embed_and_store, retrieve_top_chunks
from query_llm import ask_llm

if __name__ == "__main__":
    print("\nWelcome to Chat with GitHub Code RAG CLI")
    user_input = input("Enter GitHub repo URL or local folder path: ").strip()

    # Determine input source
    if user_input.startswith("http"):
        folder = clone_repo(user_input)
    else:
        folder = user_input

    print("\n🔍 Loading code files...")
    docs = load_code_files(folder)
    print(f"Loaded {len(docs)} documents.")

    print("\n🔗 Chunking and embedding documents...")
    chunks = chunk_documents(docs)
    embed_and_store(chunks)
    print("✅ Stored in Pinecone and Redis.")

    # Start interactive chat loop
    while True:
        q = input("\nAsk a question about the code (or 'q' to quit): ")
        if q.lower() == "q":
            break
        top_chunks = retrieve_top_chunks(q)
        context = "\n\n".join(top_chunks)
        answer = ask_llm(context, q)
        print("\n💬 Answer:")
        print(answer)


