# backend/app.py
from flask import Flask
from flask_cors import CORS
import os

from inscription import register_bp
from connexion import login_bp
from paiement import payment_bp
from connexion_admin import login_admin_bp
from liste_paiement import payment_admin_bp
from ticket import validate_payment_bp


SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

app = Flask(__name__)
CORS(app)

app.register_blueprint(register_bp)   
app.register_blueprint(login_bp)      
app.register_blueprint(payment_bp)
app.register_blueprint(login_admin_bp)
app.register_blueprint(payment_admin_bp)
app.register_blueprint(validate_payment_bp)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)