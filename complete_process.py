import requests

address = 'http://localhost:3000/lotes/'
_id = '5d96d33a51c59040af3afe6b'
print ('Begin?')
input()

requests.put(f'{address}{_id}/unfinish')

stages = ['pesagem', 'mistura', 'calandragem', 'prensagem', 'secagem', 'inspeção']

for stage in stages:
    print (stage)
    input()
    requests.put(f'{address}{_id}/stages/{stage}/finished')
