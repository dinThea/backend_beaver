import requests

address = 'http://localhost:3000/lotes/'
_id = '5d967d9c3a1368d7f2fe7cb6'
print ('Begin?')
input()

requests.put(f'{address}{_id}/unfinish')

stages = ['pesagem', 'mistura', 'calandragem', 'prensagem', 'secagem', 'inspeção']

for stage in stages:
    print (stage)
    input()
    requests.put(f'{address}{_id}/stages/{stage}/finished')
