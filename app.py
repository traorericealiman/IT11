# backend/app.py
from flask import Flask
from flask_cors import CORS
from supabase import create_client, Client
import os
from inscription import register_bp
from connexion   import login_bp

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

app = Flask(__name__)
CORS(app)

app.register_blueprint(register_bp)   
app.register_blueprint(login_bp)      

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)