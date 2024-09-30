import json
import nltk
import spacy
import os
from nltk.sentiment import SentimentIntensityAnalyzer
import cv2
from fer import FER
from collections import Counter
import re
import matplotlib.pyplot as plt
from wordcloud import WordCloud
from flask import Flask, render_template, send_from_directory
import json
import os

app = Flask(__name__)


def interpret_sentiment(positive_score, neutral_score, negative_score):
    if positive_score > neutral_score and positive_score > negative_score:
        return "Positive"
    elif neutral_score >= positive_score and neutral_score >= negative_score:
        return "Neutral"
    return "Negative"

def clean_and_tokenize(text):
    text = re.sub(r'[^\w\s]', '', text.lower())
    words = text.split()
    return words


output_folder = 'output_files'
upload_folder = 'output_files'

def analyseData(email):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    with open('response.json', 'r') as file:
        data = json.load(file)
        filtered_data = [item for item in data if item['email'] == email]


    questions_and_answers = [
        {
            "question": response['question'],
            "answer": response['answer'],
            "videofile": response['videofile']
        }
        for response in filtered_data[0]['response']
    ]

    nltk.download('vader_lexicon')

    sia = SentimentIntensityAnalyzer()
    emotion_detector = FER()
    nlp = spacy.load('en_core_web_sm')



    overall_emotion_counts = Counter()
    overall_sentiment_counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
    all_answers_text = ""
    total_questions = len(questions_and_answers)

    output_data = {"results": [], "overall_sentiment_percentages": {}, "overall_emotion_percentages": {}}

    for index, qa in enumerate(questions_and_answers):
        question = qa['question']
        answer = qa['answer']
        videofile = qa['videofile']
        all_answers_text += answer + " "

    sentiment_scores = sia.polarity_scores(answer)

    positive_score = sentiment_scores['pos']
    negative_score = sentiment_scores['neg']
    neutral_score = sentiment_scores['neu']
    
    sentiment = interpret_sentiment(positive_score, neutral_score, negative_score)

    overall_sentiment_counts[sentiment] += 1

    doc = nlp(answer)
    entities = [(ent.text, ent.label_) for ent in doc.ents]

    output_data['results'].append({
        "question": question,
        "answer": answer,
        "sentiment_score": sentiment_scores['compound'],
        "sentiment": sentiment,
        "sentiment_percentages": {
            "Positive": round(positive_score * 100, 2),
            "Neutral": round(neutral_score * 100, 2),
            "Negative": round(negative_score * 100, 2)
        },
        "entities": entities,
        "emotions": {},
        "videofile": videofile
    })

    # Video emotion analysis
    print(f"Analyzing emotions from video: {videofile}")
    cap = cv2.VideoCapture(videofile)
    frame_count = 0

    emotion_counts = {
        'angry': 0,
        'disgust': 0,
        'fear': 0,
        'happy': 0,
        'sad': 0,
        'surprise': 0,
        'neutral': 0
    }

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        if frame_count % 30 == 0:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = emotion_detector.detect_emotions(rgb_frame)

            if result:
                emotions = result[0]['emotions']
                for emotion, score in emotions.items():
                    if score > 0.5:
                        emotion_counts[emotion] += 1

    cap.release()
    overall_emotion_counts.update(emotion_counts)

    output_data['results'][-1]['emotions'] = emotion_counts

    overall_sentiment_percentages = {
        "Positive": round((overall_sentiment_counts["Positive"] / total_questions) * 100, 2),
        "Neutral": round((overall_sentiment_counts["Neutral"] / total_questions) * 100, 2),
        "Negative": round((overall_sentiment_counts["Negative"] / total_questions) * 100, 2)
    }
    output_data["overall_sentiment_percentages"] = overall_sentiment_percentages

    total_emotions = sum(overall_emotion_counts.values())
    overall_emotion_percentages = {k: round((v / total_emotions) * 100, 2) if total_emotions > 0 else 0 for k, v in overall_emotion_counts.items()}
    output_data["overall_emotion_percentages"] = overall_emotion_percentages

    plt.figure(figsize=(10, 6))
    plt.plot([f"Q{i+1}" for i in range(len(questions_and_answers))], overall_sentiment_counts.values(), marker='o', color='blue')
    plt.title('Sentiment Analysis for Each Answer')
    plt.xlabel('Questions')
    plt.ylabel('Sentiment Count')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(output_folder, 'sentiment_analysis_chart.png'))

    plt.figure(figsize=(10, 6))
    plt.bar(overall_emotion_counts.keys(), overall_emotion_counts.values(), color='orange')
    plt.title('Overall Emotion Counts from Video Analysis')
    plt.xlabel('Emotions')
    plt.ylabel('Frequency')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(output_folder, 'emotion_analysis_chart.png'))

    # Word Cloud Generation
    cleaned_answers = clean_and_tokenize(all_answers_text)
    wordcloud_text = ' '.join(cleaned_answers) 

    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(wordcloud_text)

    wordcloud.to_file(os.path.join(output_folder, 'wordcloud_answers.png'))

    print(f"Charts saved successfully in '{output_folder}'.")

    with open(os.path.join(output_folder, 'result.json'), 'w') as result_file:
        json.dump(output_data, result_file, indent=4)

    print(f"Results saved successfully to '{output_folder}/result.json'.")


def load_data():
    result_path = os.path.join(output_folder, 'result.json')
    with open(result_path, 'r') as file:
        data = json.load(file)
    return data

# @app.route('/')
def renderData(email):
    analyseData(email)
    data = load_data()
    sentiment_chart = os.path.join(output_folder, 'sentiment_analysis_chart.png')
    emotion_chart = os.path.join(output_folder, 'emotion_analysis_chart.png')
    wordcloud_chart = os.path.join(output_folder, 'wordcloud_answers.png')
    return render_template('home.html', data=data,
                           sentiment_chart=sentiment_chart,
                           emotion_chart=emotion_chart,
                           wordcloud_chart=wordcloud_chart)

@app.route('/output_files/<path:filename>')
def output_files(filename):
    return send_from_directory(output_folder, filename)

@app.route('/uploads/<filename>')
def uploads(filename):
    # Your logic here
    return f"File: {filename}"

# if __name__ == '__main__':
#     app.run(debug=True)


