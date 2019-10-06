import requests
import random
import json
from pymongo import MongoClient

client = MongoClient()
db = client.factory
collection = db.lotes

defaults = {}
colors = ["07","13","17","21","27","43","47","63","70","76","99"]

for color in colors:
    with open('mock_defaults.json') as mock:
        mock_pattern = json.load(mock)[0]
        generated = mock_pattern
        generated['color'] = color
        for index, stages in enumerate(mock_pattern['stages']):
            for index_v, variables in enumerate(stages['variables']):
                val = generated['stages'][index]['variables'][index_v]['value']
                if isinstance(val, (int,)):
                    generated['stages'][index]['variables'][index_v]['value'] = mock_pattern['stages'][index]['variables'][index_v]['value'] * (1 + random.random()*0.6 - 0.3)

        db.default.insert_one(generated)