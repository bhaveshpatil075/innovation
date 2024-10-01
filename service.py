import requests
import os
import speech_recognition as sr
from gtts import gTTS
from playsound import playsound
import openai
import json
from flask import jsonify
import subprocess
from pydub import AudioSegment

# Initialize recognizer
recognizer = sr.Recognizer()

# Function to convert text to speech
def text_to_speech(text, filename="output.mp3"):
    tts = gTTS(text=text, lang='en')
    tts.save(filename)
    playsound(filename)
    os.remove(filename)  # Clean up the audio file


def load_data_from_json(jsonFilename="data.json"):
    with open(jsonFilename) as file:
        data = json.load(file)
    return data

def convert_webm_to_wav(webm_file_path, wav_file_path):
    command = [
        'ffmpeg',
        '-i', webm_file_path,
        wav_file_path,
        '-y'
    ]
    subprocess.run(command, check=True)

def convert_webm_to_mp4(input_path, output_path):
    try:
        # ffmpeg command to convert webm to mp4
        subprocess.run(['ffmpeg', '-i', input_path, output_path], check=True)
        if os.path.exists(input_path):
            os.remove(input_path)
        print(f"Converted {input_path} to {output_path}")
    except Exception as e:
        print(f"Error during conversion: {e}")

# Function to recognize speech from an audio file
def recognize_speech_from_audio(file_path):
    try:
        # Load the audio file
        with sr.AudioFile(file_path) as source:
            # Adjust for ambient noise and record the audio
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.record(source)

        # Recognize the speech using Google Web Speech API
        text = recognizer.recognize_google(audio)
        if os.path.exists(file_path):
            os.remove(file_path)
        print("Transcription: ", text)
        return text
    except sr.RequestError:
        # API was unreachable or unresponsive
        print("Could not request results from the speech recognition service.")
    except sr.UnknownValueError:
        # Speech was unintelligible
        print("Unable to recognize any speech.")

def download_video(url, folder_path, file_name):    
    file_name = file_name.replace('-','intro') + '.mp4'
    file_path = os.path.join(folder_path, file_name)    
    if os.path.exists(file_path):
        return

    # Send a request to the URL
    response = requests.get(url, stream=True)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Open a file in the folder to save the video
        with open(file_path, 'wb') as video_file:
            # Write the video content in chunks to avoid memory issues
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    video_file.write(chunk)
        
        print(f"Video saved as {file_path}")
    else:
        print(f"Failed to download video. Status code: {response.status_code}")