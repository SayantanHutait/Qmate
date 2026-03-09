import chromadb

client = chromadb.Client()
vector_db = client.get_or_create_collection(name="your_collection_name")

data = vector_db.get(include=["metadatas"])
if data["metadatas"] is not None:
	print(data["metadatas"][:5])
else:
	print("No metadata found")