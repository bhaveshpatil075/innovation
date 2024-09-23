from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from service import text_to_speech, load_data_from_json, convert_webm_to_wav, recognize_speech_from_audio
from heygen import question_to_video, get_video
from werkzeug.utils import secure_filename
import os
import json

app = Flask(__name__)
CORS(app)


UPLOAD_FOLDER = 'uploads'  # Directory to save uploaded files
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/api/next-question', methods=['POST'])
def get_next_question():
    item = request.json
    role = item['role']    
    data = load_data_from_json("data.json")
    #filtered_data = [interViewRole for interViewRole in data['role'] == role]
    if role in data:
        return data[role], 200
    return 'No data found for the role', 404

# @app.route('/api/text-to-speech', methods=['GET'])
# def ai_avatar_interview():
#     print("AI Avatar: Hello, welcome to your interview. How can I assist you today?")
#     text_to_speech("Hello, welcome to your interview. How can I assist you today?")

@app.route('/api/text-to-speech', methods=['POST'])
def ai_avatar_interview():
    new_item = request.json
    print(new_item['item_text'])
    text_to_speech(new_item['item_text'])
    return jsonify({'message': 'text-to-speech converted successfully'}), 200

@app.route('/api/video-to-text', methods=['POST'])
def video_to_text():
    new_item = request.json
    webm_file = new_item['video_file']
    wav_file = new_item['audio_file']
    print(webm_file)
    print(wav_file)    
    convert_webm_to_wav(webm_file, wav_file)
    text = recognize_speech_from_audio(wav_file)
    return jsonify({'message': 'succefull', 'text': text}), 200

@app.route('/api/get-response-items', methods=['POST'])
def get_response():
    new_item = request.json
    email = new_item['email']
    role = new_item['role']
    data = load_data_from_json("response.json")
    filtered_data = [item for item in data if item['email'] == email and item['role'] == role]
    return data, 200

@app.route('/api/save-response', methods=['POST'])
def save_response():
    new_item = request.json
    email = new_item['email']    
    data = load_data_from_json("response.json")
    filtered_data = [item for item in data if item['email'] == email]
    if len(filtered_data) > 0:
        new_item  = {'questionid': new_item['questionid'], 'question': new_item['question'], 'answer': new_item['answer'], 'videofile': new_item['videofile']}  
        filtered_data[0]['response'].append(new_item)
        with open('response.json', 'w') as file:
            json.dump(data, file, indent=4)
        return jsonify({'message': 'Response updated successfully'}), 200
    else:
        new_item = {
            'email': email,            
            'response': [
                {
                    'questionid': new_item['questionid'],
                    'question': new_item['question'],
                    'answer': new_item['answer'],
                    'videofile': new_item['videofile']
                }
            ]
        }
        data.append(new_item)
        with open('response.json', 'w') as file:
            json.dump(data, file, indent=4)
    return jsonify(new_item), 201

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'File not found'}), 500

    file = request.files['file']
    if file.filename == '':
       return jsonify({'message': 'File not found'}), 500

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        print(filepath)
        if os.path.exists(filepath):
            os.remove(filepath)
        file.save(filepath)
        return jsonify({'message': 'File uploaded successfully'}), 200
    else:
       return jsonify({'message': 'Function not implemented'}), 500


@app.route('/api/question-to-video', methods=['POST'])
def question_video():
    new_item = request.json
    questionText = new_item['question_text']
    data = question_to_video(questionText)
    return data, 200

@app.route('/api/get_video', methods=['POST'])
def get_heygen_video():
    new_item = request.json
    video_id = new_item['video_id']
    print(video_id)
    data = get_video(video_id)
    return data, 200


if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
