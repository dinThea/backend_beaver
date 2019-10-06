import requests
import random
import json
from pymongo import MongoClient

client = MongoClient()
db = client.factory
collection = db.lotes

defaults = {}
for doc in db.default.find({}):
    defaults[doc['color']] = doc
    
colors = ["01","07","13","17","21","27","43","47","63","70","76","99"]

for color in colors:
    mock_pattern = defaults[color]
    generated = dict(mock_pattern)
    generated['color'] = color
    for index, stages in enumerate(mock_pattern['stages']):
        for index_v, variables in enumerate(stages['variables']):
            val = generated['stages'][index]['variables'][index_v]['value']
            if isinstance(val, (float,)):
                val_mock = mock_pattern['stages'][index]['variables'][index_v]['value'] 
                rand = val_mock*(1 + random.random()*0.6 - 0.3)
                generated['stages'][index]['variables'][index_v]['value'] = (int(100*rand))/100.00
                try:
                    value = generated['stages'][index]['variables'][index_v]['value']
                    divisor = val_mock
                    generated['stages'][index]['variables'][index_v]['error'] = (int(100*(-1 + value/divisor)))/100.00
                except:
                    generated['stages'][index]['variables'][index_v]['error'] = 0
            else:
                generated['stages'][index]['variables'][index_v]['error'] = 0

    generated.pop('_id', None)
    db.lotes.insert_one(generated)