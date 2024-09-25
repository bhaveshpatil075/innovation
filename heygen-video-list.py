import requests

url = "https://api.heygen.com/v1/video.list?limit=10"

headers = {
    "accept": "application/json",
    "x-api-key": ""
}

response = requests.get(url, headers=headers)

print(response.text)