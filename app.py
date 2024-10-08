from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from service import text_to_speech, load_data_from_json, convert_webm_to_wav, recognize_speech_from_audio, convert_webm_to_mp4, download_video
# from heygen import question_to_video, get_video
from synthesia import question_to_video, get_video
from combinevideo import combine_videos
from werkzeug.utils import secure_filename
from analysis import renderData
import os
import json

app = Flask(__name__)
CORS(app)


UPLOAD_FOLDER = 'uploads'  # Directory to save uploaded files
output_folder = 'output_files'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/home/<email>')
def load_analysis(email):    
    return renderData(email)


def load_data():
    result_path = os.path.join(OUTPUT_FOLDER, 'result.json')
    with open(result_path, 'r') as file:
        data = json.load(file)
    return data

@app.route('/api/next-question', methods=['POST'])
def get_next_question():
    item = request.json
    role = item['role']    
    data = load_data_from_json("data.json")
    #filtered_data = [interViewRole for interViewRole in data['role'] == role]
    if role in data:
        return data[role], 200
    return 'No data found for the role', 404

@app.route('/api/text-to-speech', methods=['POST'])
def ai_avatar_interview():
    new_item = request.json    
    text_to_speech(new_item['item_text'])
    return jsonify({'message': 'text-to-speech converted successfully'}), 200

@app.route('/api/video-to-text', methods=['POST'])
def video_to_text():
    new_item = request.json
    webm_file = new_item['video_file']
    wav_file = new_item['audio_file']    
    convert_webm_to_wav(webm_file, wav_file)
    text = recognize_speech_from_audio(wav_file)
    return jsonify({'message': 'succefull', 'text': text}), 200

@app.route('/api/get-response-items', methods=['POST'])
def get_response():
    new_item = request.json
    email = new_item['email']
    role = new_item['role']
    data = load_data_from_json("response.json")
    filtered_data = [item for item in data if item['email'] == email]
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
        newfilepath = os.path.join(app.config['UPLOAD_FOLDER'], filename.replace('webm','mp4'))        
        if os.path.exists(filepath):
            os.remove(filepath)
        file.save(filepath)

        convert_webm_to_mp4(filepath, newfilepath)
        
        return jsonify({'message': 'File uploaded successfully'}), 200
    else:
       return jsonify({'message': 'Function not implemented'}), 500


@app.route('/api/question-to-video', methods=['POST'])
def question_video():
    new_item = request.json
    questionText = new_item['question_text']
    title = new_item['question_title']
    data = question_to_video(questionText, title)
    return data, 200

@app.route('/api/get_video', methods=['POST'])
def get_heygen_video():
    new_item = request.json
    video_id = new_item['video_id']
    text = get_video(video_id)
    data = json.loads(text)        
    # if(data['status'] == "complete"):
    #     download_video(data['download'], 'uploads', data['title'].replace(' ', '_'))    
    return text, 200

@app.route('/api/combine-video', methods=['POST'])
def merge_videos():
    new_item = request.json
    video_arr = new_item['video_arr']
    merge_video_name = new_item['merge_video_name']
    combine_videos(video_arr, merge_video_name)
    return jsonify({'message': 'succefull'}), 200

@app.route('/output_files/<path:filename>')
def output_files(filename):
    return send_from_directory(output_folder, filename)

@app.route('/uploads/<filename>')
def uploads(filename):
    # Your logic here
    return f"File: {filename}"

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
