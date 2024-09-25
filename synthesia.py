import requests

api_key = ""

def question_to_video(questionText, title):
    url = "https://api.synthesia.io/v2/videos"
    payload = {
    "test": False,
    "visibility": "private",
    "aspectRatio": "16:9",
    "input": [
            {
                "avatarSettings": {
                    "horizontalAlign": "center",
                    "scale": 1,
                    "style": "rectangular",
                    "seamless": False
                },
                "backgroundSettings": { "videoSettings": {
                        "shortBackgroundContentMatchMode": "freeze",
                        "longBackgroundContentMatchMode": "trim"
                    } },
                "scriptText": questionText,
                "avatar": "anna_costume1_cameraA",
                "background": "green_screen"
            }
        ],
        "title": title
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": "6dd1f8c9c400eac23900b091d409c1e7"
    }

    response = requests.post(url, json=payload, headers=headers)

    print(response.text)
    return response.text

# question_to_video('I believe that my assistant Kevin sent you an e-mail regarding the purpose of this meeting.  I’m keenly interested in how Selenica can support the goals of Emland to reduce healthcare costs', 'HI')

def get_video(video_id):
    url = "https://api.synthesia.io/v2/videos/" + video_id

    headers = {
        "accept": "application/json",
        "Authorization": api_key
    }

    response = requests.get(url, headers=headers)

    print(response.text)
    return response.text

# get_video('77c3961b-84db-4ec5-91cc-a679bb6af7fe')