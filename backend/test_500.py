import traceback
from app import app
from dotenv import load_dotenv
import os

load_dotenv()

try:
    with app.test_client() as client:
        response = client.post('/payment/approve/bf568312-7c20-4a44-9a0e-8ff0f5858213', 
                               headers={'Authorization': f'Bearer {os.environ.get("ADMIN_SECRET")}'})
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.data.decode('utf-8')}")
except Exception as e:
    print("Exception occurred:")
    traceback.print_exc()
