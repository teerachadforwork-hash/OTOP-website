import urllib.request
import urllib.parse
import json

url_login = "http://127.0.0.1:8000/api/auth/login"
data = urllib.parse.urlencode({'username': 'admin@otop.th', 'password': 'admin123'}).encode()
req = urllib.request.Request(url_login, data=data)
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        token = result['access_token']
        
        req_users = urllib.request.Request("http://127.0.0.1:8000/api/auth/users", headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req_users) as response_users:
            users = json.loads(response_users.read().decode())
            print(f"Status: 200, Users fetched: {len(users)}")
except Exception as e:
    print(f"Error: {e}")
