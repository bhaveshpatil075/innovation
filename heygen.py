import requests

api_key = ""


def question_to_video(questionText):
    url = "https://api.heygen.com/v1/video.webm"
    payload = {
        "avatar_pose_id": "Vanessa-invest-20220722",
        "avatar_style": "normal",
        "input_text": questionText,
        "voice_id": "1bd001e7e50f421d891986aad5158bc8"
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": api_key
    }
    response = requests.post(url, json=payload, headers=headers)
    print(response.text)
    return response.text

def get_video(video_id):
    url = "https://api.heygen.com/v1/video_status.get?video_id=" + video_id
    headers = {
        "accept": "application/json",
        "x-api-key": "ZGEwODIyMTczNGVmNGU0NmFmMWMxY2FmMGU1Y2Q0MTQtMTcyNjE1MTg5Ng=="
    }

    response = requests.get(url, headers=headers)
    print(response.text)
    return response.text