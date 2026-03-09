import requests
import json

url = 'http://127.0.0.1:8000/reports'
files = {'image': ('test.jpg', b'fake image data', 'image/jpeg')}
data = {
    'description': 'water pipe burst near my house',
    'latitude': '13.0827',
    'longitude': '80.2707'
}

try:
    response = requests.post(url, files=files, data=data, timeout=10)
    result = response.json()
    print('Current API Response Structure:')
    print(json.dumps(result, indent=2))
 
    if 'risk' in result:
        print('✅ Risk field is present in response')
        print(f'Risk value: {result["risk"]}')
    else:
        print('❌ Risk field is missing from response')
        
except Exception as e:
    print(f'Error: {e}')
