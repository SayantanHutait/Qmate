import sys
import os

# Add backend dir to path so we can import models/config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings
from models.schemas import DocumentType

def migrate():
    print("Connecting to ChromaDB...")
    client = chromadb.PersistentClient(
        path=settings.chroma_persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    collection = client.get_or_create_collection(
        name=settings.chroma_collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    print(f"Total documents before migration: {collection.count()}")
    
    # Get all PDF documents
    results = collection.get(
        where={"doc_type": DocumentType.PDF.value},
        include=["metadatas"]
    )
    
    if not results or not results["ids"]:
        print("No PDF documents found to migrate.")
        return

    ids = results["ids"]
    metadatas = results["metadatas"]
    
    updated_count = 0
    updated_ids = []
    updated_metadatas = []

    for doc_id, meta in zip(ids, metadatas):
        if "department" not in meta:
            meta["department"] = "General"
            updated_ids.append(doc_id)
            updated_metadatas.append(meta)
            updated_count += 1
            
    if updated_count > 0:
        print(f"Updating {updated_count} PDF chunks...")
        collection.update(
            ids=updated_ids,
            metadatas=updated_metadatas
        )
        print("Migration complete!")
    else:
        print("All PDF chunks already have a department. No migration needed.")

if __name__ == "__main__":
    migrate()
