"""
Portfolio Routes Module.

Handles all URL routing for the portfolio, including:
- Homepage rendering (showcasing projects)
- Project listing
- Resume downloads
- Contact form submissions via SMTP
- Project detail views
"""

import os
import json
import re
from pathlib import Path
from flask import (
    render_template,
    request,
    send_file,
    current_app,
    abort,
    jsonify,
    url_for,
)
from flask_mail import Message
from . import portfolio_bp

# Define paths for data files
DATA_DIR = Path(__file__).parent / "data"
PROJECTS_JSON = DATA_DIR / "projects.json"
SITE_DATA_JSON = DATA_DIR / "site_data.json"
PROJECT_DETAILS_JSON = DATA_DIR / "project_details.json"


def load_json_data(path, default=None):
    """
    Safely loads JSON data from a given path.
    Returns the default value if the file is missing or corrupt.
    """
    if default is None:
        default = []
    try:
        if not path.exists():
            return default
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        current_app.logger.exception(f"Failed to load {path.name}")
        return default


def get_merged_project_data(project_id):
    """
    Fetches basic metadata from projects.json and detailed content
    from project_details.json, merging them into one object.
    """
    all_projects = load_json_data(PROJECTS_JSON, default=[])
    all_details = load_json_data(PROJECT_DETAILS_JSON, default=[])

    project_meta = next((p for p in all_projects if p["id"] == project_id), None)

    if not project_meta:
        return None

    project_detail = next((d for d in all_details if d["id"] == project_id), {})

    return {**project_meta, **project_detail}


@portfolio_bp.route("/", methods=["GET"])
def home():
    """
    Renders the homepage.
    Selects up to 3 featured projects for the hero section.
    """
    projects = load_json_data(PROJECTS_JSON, default=[])
    site_data = load_json_data(SITE_DATA_JSON, default={})

    # Prioritize projects marked as 'featured'
    featured = [p for p in projects if p.get("featured")]

    if len(featured) >= 3:
        featured_main = featured[:3]
    else:
        # Fallback: Fill remaining spots with unique top projects
        seen = set()
        top = []
        for p in featured + projects:
            pid = p.get("id")
            if pid and pid not in seen:
                top.append(p)
                seen.add(pid)
            if len(top) >= 3:
                break
        featured_main = top

    return render_template(
        "index.html",
        projects=projects,
        featured_main=featured_main,
        data=site_data
    )


@portfolio_bp.route("/projects", methods=["GET"])
def all_projects():
    """Renders the full list of projects."""
    projects = load_json_data(PROJECTS_JSON, default=[])
    return render_template("projects.html", projects=projects)


@portfolio_bp.route("/project/<project_id>", methods=["GET"])
def project_detail(project_id):
    """
    Renders the dedicated project detail page.
    Handles 'pipelined' navigation via the ?from= query parameter.
    """
    project = get_merged_project_data(project_id)

    if not project:
        abort(404)

    referrer = request.args.get("from")

    if referrer == "home":
        back_url = url_for("portfolio.home") + "#projects"
        back_text = "Back to Home"
    elif referrer == "archive":
        back_url = url_for("portfolio.all_projects")
        back_text = "Back to All Projects"
    else:
        back_url = url_for("portfolio.all_projects")
        back_text = "Back to Projects"

    return render_template(
        "project_detail.html",
        project=project,
        back_url=back_url,
        back_text=back_text
    )


@portfolio_bp.route("/download-resume", methods=["GET"])
def download_resume():
    """
    Serves the resume PDF for download.
    """
    filename = "muthukumaran-resume.pdf"
    resume_path = Path(__file__).parent / "static" / "files" / filename

    if not resume_path.exists():
        current_app.logger.error(f"Resume not found at {resume_path}")
        abort(404)

    return send_file(
        resume_path,
        as_attachment=True,
        mimetype="application/pdf",
        download_name=filename
    )


@portfolio_bp.route("/contact", methods=["POST"])
def contact():
    """
    Handles AJAX contact form submissions.
    Validates input and sends email via Flask-Mail.
    """
    # 1. Extract and sanitize input
    name = (request.form.get("name") or "").strip()
    email = (request.form.get("email") or "").strip()
    message = (request.form.get("message") or "").strip()

    email_regex = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

    # 2. Validate input
    errors = []
    if not name:
        errors.append("Please enter your name.")
    if not email:
        errors.append("Please enter your email address.")
    elif not email_regex.match(email):
        errors.append("Please enter a valid email address.")
    if not message:
        errors.append("Please enter a message.")
    elif len(message) < 10:
        errors.append("Message is too short — please write a few more words.")

    if errors:
        return jsonify({"status": "error", "message": errors[0]}), 400

    # 3. Check Mail Configuration
    recipient = os.getenv("MAIL_RECIPIENT") or current_app.config.get("MAIL_RECIPIENT")
    mail = getattr(current_app, "mail", None) or current_app.extensions.get("mail")

    if not recipient or not mail:
        current_app.logger.error("Mail configuration missing.")
        return jsonify({
            "status": "error",
            "message": "System configuration error. Please try again later."
        }), 500

    # 4. Construct and Send Email
    msg = Message(
        subject=f"Portfolio Contact from {name}",
        sender=current_app.config.get("MAIL_DEFAULT_SENDER"),
        recipients=[recipient],
        body=f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}",
    )

    try:
        msg.reply_to = email
        mail.send(msg)
        return jsonify({"status": "success", "message": "Message sent successfully!"}), 200
    except Exception:
        current_app.logger.exception("Failed to send email")
        return jsonify({
            "status": "error",
            "message": "Failed to send email. Please try again later."
        }), 500
