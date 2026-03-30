# backend/app.py
from flask import Flask
from flask_cors import CORS
import os

from connexion import login_bp


# ══════════════════════════════════════════════════════════════
#  APPLICATION
# ══════════════════════════════════════════════════════════════

app = Flask(__name__)
CORS(app)


from inscription import register, app as _insc_app

# Copie les routes de inscription.py dans notre app principale
for rule in _insc_app.url_map.iter_rules():
    view_func = _insc_app.view_functions[rule.endpoint]
    app.add_url_rule(str(rule), rule.endpoint, view_func, methods=rule.methods)

# ── /login : blueprint de connexion.py ──────────────────────
app.register_blueprint(login_bp)


# ══════════════════════════════════════════════════════════════
#  LANCEMENT
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)