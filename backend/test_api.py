import requests

res = requests.post("http://127.0.0.1:8000/api/auth/login", data={"username": "admin@otop.th", "password": "admin123"})
if res.status_code != 200:
    print("Login failed:", res.text)
else:
    token = res.json()["access_token"]
    res2 = requests.get("http://127.0.0.1:8000/api/auth/users", headers={"Authorization": f"Bearer {token}"})
    print("Users status:", res2.status_code)
    if res2.status_code != 200:
        print("Error details:", res2.text)
    else:
        print("Fetched users successfully")
