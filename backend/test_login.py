from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

res = client.post("/api/auth/login", data={"username": "AGENT001", "password": "*123"})
print("AGENT001 login:", res.status_code, res.text)

res2 = client.post("/api/auth/login", data={"username": "admin@college.edu", "password": "*123"})
print("Admin login:", res2.status_code, res2.text)

res3 = client.post("/api/auth/login", data={"username": "12214919", "password": "*123"})
print("Student login:", res3.status_code, res3.text)
