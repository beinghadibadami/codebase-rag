# ✅ FILE: query_llm.py
from groq import Groq
import os
from dotenv import load_dotenv

# Load environment and set API key
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API")

client = Groq(api_key=GROQ_API_KEY)

def ask_llm(context, query):
    # Create final prompt with retrieved context and user query
    prompt = f"""
You are a helpful assistant. Use the following context to answer the user's question.

{context}

Question: {query}
Answer:
"""
    # Send to Groq LLM
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_completion_tokens=1024,
        top_p=1,
        stream=False
    )
    return completion.choices[0].message.content.strip()