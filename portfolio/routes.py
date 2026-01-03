"""
Portfolio Routes Module.

Handles all URL routing for the portfolio, including:
- Homepage rendering (showcasing projects)
- Project listing
- Resume downloads
- Contact form submissions via SMTP
- Project detail views
- API for Command Palette
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


def load_json_data(path, default=None):
    """
    Safely loads JSON data from a given path.
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


@portfolio_bp.route("/", methods=["GET"])
def home():
    """Renders the homepage."""
    projects = load_json_data(PROJECTS_JSON, default=[])
    site_data = load_json_data(SITE_DATA_JSON, default={})

    featured = [p for p in projects if p.get("featured")]
    if len(featured) >= 3:
        featured_main = featured[:3]
    else:
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
    """Renders the dedicated project detail page."""
    projects = load_json_data(PROJECTS_JSON, default=[])
    project = next((p for p in projects if p["id"] == project_id), None)

    if not project:
        abort(404)

    current_index = projects.index(project)
    prev_project = projects[current_index - 1] if current_index > 0 else None
    next_project = projects[current_index + 1] if current_index < len(projects) - 1 else None

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
        prev_project=prev_project,
        next_project=next_project,
        back_url=back_url,
        back_text=back_text
    )


@portfolio_bp.route("/download-resume", methods=["GET"])
def download_resume():
    """Serves the resume PDF (Opens in Browser)."""
    filename = "muthukumaran-resume.pdf"
    resume_path = Path(__file__).parent / "static" / "files" / filename

    if not resume_path.exists():
        current_app.logger.error(f"Resume not found at {resume_path}")
        abort(404)

    return send_file(
        resume_path,
        as_attachment=False,  # Changed to False to open in browser
        mimetype="application/pdf",
        download_name=filename
    )


@portfolio_bp.route("/contact", methods=["POST"])
def contact():
    """Handles contact form submissions."""
    name = (request.form.get("name") or "").strip()
    email = (request.form.get("email") or "").strip()
    message = (request.form.get("message") or "").strip()

    email_regex = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    errors = []

    if not name: errors.append("Please enter your name.")
    if not email: errors.append("Please enter your email address.")
    elif not email_regex.match(email): errors.append("Please enter a valid email address.")
    if not message: errors.append("Please enter a message.")
    elif len(message) < 10: errors.append("Message is too short.")

    if errors:
        return jsonify({"status": "error", "message": errors[0]}), 400

    recipient = os.getenv("MAIL_RECIPIENT") or current_app.config.get("MAIL_RECIPIENT")
    mail = getattr(current_app, "mail", None) or current_app.extensions.get("mail")

    if not recipient or not mail:
        return jsonify({"status": "error", "message": "System configuration error."}), 500

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
        return jsonify({"status": "error", "message": "Failed to send email."}), 500


@portfolio_bp.route("/api/search-data", methods=["GET"])
def get_search_data():
    """
    API endpoint for Command Palette.
    Returns structured data for Pages, Projects, Socials, etc.
    """
    projects_data = load_json_data(PROJECTS_JSON, default=[])
    site_data = load_json_data(SITE_DATA_JSON, default={})

    # 1. Pages (Dynamic URL generation)
    pages = [
        {"id": "home", "title": "Home", "desc": "Go to Homepage", "url": url_for('portfolio.home'), "icon": "home", "group": "Pages"},
        {"id": "about", "title": "About", "desc": "Read my story", "url": url_for('portfolio.home') + "#about", "icon": "user", "group": "Pages"},
        {"id": "projects_section", "title": "Featured Projects", "desc": "View highlighted work", "url": url_for('portfolio.home') + "#projects", "icon": "star", "group": "Pages"},
        {"id": "all_projects", "title": "All Projects Archive", "desc": "View full project list", "url": url_for('portfolio.all_projects'), "icon": "archive", "group": "Pages"},
        {"id": "awards", "title": "Awards", "desc": "Honors & Certifications", "url": url_for('portfolio.home') + "#awards", "icon": "award", "group": "Pages"},
        {"id": "contact", "title": "Contact", "desc": "Get in touch", "url": url_for('portfolio.home') + "#contact", "icon": "mail", "group": "Pages"},
    ]

    # 2. Top 3 Projects
    top_projects = []
    # Sort by featured first, then grab top 3
    sorted_projects = sorted(projects_data, key=lambda x: x.get('featured', False), reverse=True)
    for p in sorted_projects[:3]:
        top_projects.append({
            "id": f"proj_{p['id']}",
            "title": p['title'],
            "desc": p.get('role', 'Project'),
            "url": url_for('portfolio.project_detail', project_id=p['id']),
            "icon": "zap",
            "group": "Top Projects"
        })

    # 3. Connect (Socials)
    socials = []
    if "socials" in site_data:
        for s in site_data["socials"]:
            socials.append({
                "id": f"soc_{s['name']}",
                "title": s['name'],
                "desc": s.get('handle', 'Connect'),
                "url": s['url'],
                "icon": s.get('icon', 'link'),
                "group": "Connect",
                "external": True
            })

    # 4. Resume
    resume = [{
        "id": "resume",
        "title": "View Resume",
        "desc": "Open PDF in Browser",
        "url": url_for('portfolio.download_resume'),
        "icon": "external-link",
        "group": "Resume",
        "external": True
    }]

    return jsonify({
        "pages": pages,
        "projects": top_projects,
        "connect": socials,
        "resume": resume
    })
