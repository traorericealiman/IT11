# backend/app.py
from flask import Flask
from flask_cors import CORS
import os

from .routes.inscription import register_bp
from .routes.connexion   import login_bp
from .routes.paiement    import payment_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(register_bp)
app.register_blueprint(login_bp)
app.register_blueprint(payment_bp)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
