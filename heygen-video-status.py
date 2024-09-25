import requests

url = "https://api.heygen.com/v1/video_status.get?video_id=15ebcddb29364a39a857e23853bcef68"

headers = {
    "accept": "application/json",
    "x-api-key": ""
}

response = requests.get(url, headers=headers)

print(response.text)