import requests
from pymongo import MongoClient

client = MongoClient()
db = client.factory
collection = db.lotes

defaults = {}
for doc in db.default.find({}):
    defaults[doc['color']] = doc

for element in collection.find({}):
    new_element = element
    for index, stages in enumerate(element['stages']):
        for index_v, variables in enumerate(stages['variables']):
            try:
                value = int(new_element['stages'][index]['variables'][index_v]['value'])
                new_element['stages'][index]['variables'][index_v]['error'] = -1 + (value)/float(defaults[element['color']]['stages'][index]['variables'][index_v]['value'])
            except:
                new_element['stages'][index]['variables'][index_v]['error'] = 0

    _id = str(element['_id'])
    new_element.pop('_id', None)
    requests.post(f'http://localhost:3000/lotes/?id={_id}/change', json=new_element)

    print (new_element)  
    print (element['color'])