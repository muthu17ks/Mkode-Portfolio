"""
Application Entry Point.

This module initializes the Flask application, loads environment variables,
configures extensions (Mail, CSRF, Limiter), and registers the main portfolio blueprint.
"""

import os
from datetime import datetime
from flask import Flask
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect, generate_csrf
from dotenv import load_dotenv
from portfolio import portfolio_bp, limiter

load_dotenv()

app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["RATELIMIT_STORAGE_URI"] = "memory://"
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True") == "True"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER")

mail = Mail(app)
csrf = CSRFProtect(app)

limiter.init_app(app)

app.mail = mail

@app.context_processor
def inject_global_vars():
    """
    Injects global variables into all templates.
    1. csrf_token: For secure forms.
    2. current_year: Automates the copyright year in the footer.
    """
    return {
        "csrf_token": generate_csrf,
        "current_year": datetime.now().year
    }

app.register_blueprint(portfolio_bp)

@app.after_request
def add_security_headers(response):
    """
    Adds security headers to every response to prevent clickjacking,
    MIME sniffing, and enforce strict HTTPS transport security.
    """
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response

if __name__ == "__main__":
    app.run(debug=True)
