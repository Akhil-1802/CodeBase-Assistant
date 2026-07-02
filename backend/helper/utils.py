import os
from typing import List
from git import Repo
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from collections import Counter
from helper.Session import session

load_dotenv()

# ---------------------------
# Embedding Model
# ---------------------------

embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")

# ---------------------------
# Text Splitter
# ---------------------------

splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=300)

# ---------------------------
# Clone & Index Repo
# ---------------------------

def get_codebase_structure(repo_url: str):
    if(repo_url == ""):
        return "No repository URL provided. Please provide a valid GitHub URL."
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    session.active_repo = repo_name
    clone_path = f"repos/{repo_name}"

    os.makedirs("repos", exist_ok=True)

    if not os.path.exists(clone_path):
        Repo.clone_from(repo_url, clone_path)

    ignore_dirs = {".git", "node_modules", "__pycache__", "dist", "build"}
    all_files = []

    for root, dirs, files in os.walk(clone_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            if file == "package-lock.json":
                continue
            all_files.append(os.path.join(root, file))

    build_vector_store(all_files)
    return f"Repository **{repo_name}** loaded successfully! {len(all_files)} files indexed."

# ---------------------------
# Vector Store
# ---------------------------

def load_vector_store() -> Chroma:
    repo = session.active_repo
    return Chroma(
        persist_directory=f"./chroma_db/{repo}",
        embedding_function=embeddings,
    )

def build_vector_store(repo_files: List[str]):
    documents = get_file_content(repo_files)
    docs = create_chunks(documents)
    print(f"Created {len(docs)} chunks")
    Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=f"./chroma_db/{session.active_repo}",
    )
    print("Embeddings stored successfully!")

# ---------------------------
# File Helpers
# ---------------------------

def get_file_content(files: List[str]) -> List[dict]:
    documents = []
    for file in files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                documents.append({"path": file, "content": f.read()})
        except Exception as e:
            print(f"Failed to read {file}: {e}")
    return documents


def create_chunks(documents: List[dict]) -> List[Document]:
    docs = []
    for doc in documents:
        for idx, chunk in enumerate(splitter.split_text(doc["content"])):
            docs.append(
                Document(
                    page_content=chunk,
                    metadata={"repo": session.active_repo, "path": doc["path"], "chunk_id": idx},
                )
            )
    return docs

# ---------------------------
# Retrieval
# ---------------------------

def get_all_repo_files() -> List[str]:
    """Return every unique file path indexed for the active repo."""
    vs = load_vector_store()
    data = vs.get()
    seen = set()
    files = []
    for meta in data["metadatas"]:
        p = meta["path"]
        if p not in seen:
            seen.add(p)
            files.append(p)
    return files


def find_relevant_files(query: str, k: int = 5) -> List[str]:
    """Use MMR search to retrieve diverse, relevant files for a query."""
    vs = load_vector_store()

    # MMR enforces diversity so we get chunks from different files
    results = vs.max_marginal_relevance_search(
        query,
        k=k * 3,        # fetch more candidates
        fetch_k=60,     # pool to pick from
        lambda_mult=0.5, # balance relevance vs diversity
    )

    file_counter = Counter()
    for doc in results:
        file_counter[doc.metadata["path"]] += 1

    return [path for path, _ in file_counter.most_common(k)]


def build_context(files: List[str]) -> str:
    context = ""
    for file in files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                context += f"\nFILE: {file}\n\n{f.read()}\n\n{'='*50}\n"
        except Exception as e:
            context += f"\nFILE: {file}\n[Could not read: {e}]\n\n{'='*50}\n"
    return context
