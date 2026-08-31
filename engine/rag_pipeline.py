import os
import sys
import json
from dotenv import load_dotenv
from openai import OpenAI
from langchain_openai import OpenAIEmbeddings
import chromadb

load_dotenv()

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "financial_fillings"

# Load environment configuration
api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")

if not api_key:
    print("[ERROR]: Missing API key in .env", flush=True)
    sys.exit(1)

client = OpenAI(
    api_key=api_key,
    base_url=base_url
)

embedding_model = OpenAIEmbeddings(
    openai_api_key=api_key,
    openai_api_base=base_url,
    model="text-embedding-3-small"
)

def query_rag(user_query: str, top_k: int = 4):
    # 1. Embed query vector
    query_vector = embedding_model.embed_query(user_query)

    # 2. Retrieve nearest chunks from ChromaDB
    chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    collection = chroma_client.get_collection(name=COLLECTION_NAME)

    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        include=["documents", "metadatas"]
    )

    retrieved_docs = results["documents"][0] if results["documents"] else []
    retrieved_metas = results["metadatas"][0] if results["metadatas"] else []

    if not retrieved_docs:
        return {
            "answer": "Insufficient disclosure in provided filing.",
            "citations": []
        }

    # 3. Format structured context
    context_blocks = []
    for doc, meta in zip(retrieved_docs, retrieved_metas):
        source = meta.get("source", "filing.pdf")
        page = meta.get("page", 1)
        context_blocks.append(f"[Source: {source} | Page: {page}]\n{doc}")

    formatted_context = "\n\n---\n\n".join(context_blocks)

    system_prompt = (
        "You are Axiom, an enterprise financial compliance AI engine.\n"
        "Answer the user query strictly and solely using the provided Context.\n\n"
        "Rules:\n"
        "1. Every claim or balance metric must include an explicit citation: [Source: <filename>, Page: <page_number>].\n"
        "2. If the context does not contain enough information, reply exactly: 'Insufficient disclosure in provided filing.'\n"
        "3. Keep the tone concise, factual, and audit-ready."
    )

    user_content = f"Context:\n{formatted_context}\n\nQuery: {user_query}"

    # 4. Generate audited completion
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.0
    )

    return {
        "answer": response.choices[0].message.content,
        "citations": retrieved_metas
    }

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "What are the primary operational risks and total net revenues reported in the filing?"
    output = query_rag(query)
    print("\n--- AXIOM AUDITED ANSWER ---", flush=True)
    print(output["answer"], flush=True)
    print("\n--- RETRIEVED SOURCES ---", flush=True)
    print(json.dumps(output["citations"], indent=2), flush=True)