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
