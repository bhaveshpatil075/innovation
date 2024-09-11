from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from service import text_to_speech, load_data_from_json
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
CORS(app)
# Sample data
items = [
    {'id': 1, 'name': 'Item 1', 'description': 'Description of Item 1'},
    {'id': 2, 'name': 'Item 2', 'description': 'Description of Item 2'}
]

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/api/items', methods=['GET'])
def get_items():
    return jsonify(items)

@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    item = next((item for item in items if item['id'] == item_id), None)
    if item:
        return jsonify(item)
    else:
        return jsonify({'message': 'Item not found'}), 404

@app.route('/api/items', methods=['POST'])
def create_item():
    new_item = request.json
    items.append(new_item)
    return jsonify(new_item), 201

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = next((item for item in items if item['id'] == item_id), None)
    if item:
        data = request.json
        item.update(data)
        return jsonify(item)
    else:
        return jsonify({'message': 'Item not found'}), 404

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    global items
    items = [item for item in items if item['id'] != item_id]
    return jsonify({'message': 'Item deleted'})


if __name__ == '__main__':    
    app.run(debug=True)
