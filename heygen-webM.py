import requests

url = "https://api.heygen.com/v1/video.webm"

payload = {
    "avatar_pose_id": "Tyler-insuit-20220721",
    "avatar_style": "normal",
    "input_text": "Hello Bhavesh Patil, welcome to your interview.",
    "voice_id": "d7bbcdd6964c47bdaae26decade4a933"
}
headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "x-api-key": ""
}

response = requests.post(url, json=payload, headers=headers)

print(response.text)