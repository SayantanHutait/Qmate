import urllib.request
try:
    req = urllib.request.Request('http://localhost:8000/api/chat/health')
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
