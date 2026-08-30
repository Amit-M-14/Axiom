import os
import uuid
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import chromadb

load_dotenv()

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "financial_fillings"

def ingest_pdf(pdf_path: str):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    # Load the PDF with page number attached
    loader = PyPDFLoader(pdf_path)
    raw_pages = loader.load()
    print(f"[INGEST]: Loaded {len(raw_pages)} pages from {os.path.basename(pdf_path)}")

    # Chunk with overlap to preserve the cross boundary context
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=8000,
        chunk_overlap=100,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(raw_pages)   
    print(f"[INGEST]: Split into {len(chunks)} contextual chunks")

    # Setup persistent chroma client 
    client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME, 
        metadata={"hnsw:space": "cosine"}
    )

    # Generate embedding via openai
    embedding_model = OpenAIEmbeddings(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url=os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1"),
        model="text-embedding-3-small"
    )

    documents_text = [chunk.page_content for chunk in chunks]
    metadatas = [
        {
            "source": os.path.basename(pdf_path),
            "page": chunk.metadata.get("page", 0) + 1,  # 1-indexed for human readability
            "char_count": len(chunk.page_content)
        }
        for chunk in chunks
    ]
    ids = [str(uuid.uuid4()) for _ in chunks]

    embeddings = embedding_model.embed_documents(documents_text)

    # Upsert into Vector Database
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents_text,
        metadatas=metadatas
    )
    print(f"[INGEST]: Successfully stored {len(chunks)} vectors in collection '{COLLECTION_NAME}'")