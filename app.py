"""
Application Entry Point.

This module initializes the Flask application, loads environment variables,
configures extensions (Mail, CSRF), and registers the main portfolio blueprint.
"""

import os
from flask import Flask
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect, generate_csrf
from dotenv import load_dotenv
from portfolio import portfolio_bp

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# ==============================
# Configuration
# ==============================
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

# Mail Settings
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True") == "True"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER")

# ==============================
# Initialize Extensions
# ==============================
mail = Mail(app)
csrf = CSRFProtect(app)

# Inject mail instance into app context for easier access in routes
app.mail = mail

# ==============================
# Context Processors
# ==============================
@app.context_processor
def inject_csrf():
    """Inject CSRF token generator into all templates."""
    return {"csrf_token": generate_csrf}

# ==============================
# Register Blueprints
# ==============================
app.register_blueprint(portfolio_bp)

if __name__ == "__main__":
    app.run(debug=True)
