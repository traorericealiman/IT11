# backend/app.py
import os
from dotenv import load_dotenv

# Charger les variables d'environnement (très important de le faire en premier !)
load_dotenv()

from flask import Flask
from flask_cors import CORS

from routes.inscription import register_bp
from routes.connexion   import login_bp
from routes.paiement    import payment_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(register_bp)
app.register_blueprint(login_bp)
app.register_blueprint(payment_bp)

if __name__ == "__main__":
    print("\n=== ROUTES DISPONIBLES ===")
    for rule in app.url_map.iter_rules():
        print(f"{rule.methods} {rule}")
    print("==========================\n")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)