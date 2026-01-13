"""
Portfolio Routes Module.

Handles all URL routing for the portfolio, including:
- Homepage rendering (showcasing projects)
- Project listing
- Resume downloads
- Contact form submissions via SMTP (Rate Limited)
- Project detail views
- API for Command Palette
"""

import os
import json
from pathlib import Path
from functools import lru_cache
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
from . import portfolio_bp, limiter  # Import limiter
from datetime import datetime

# Define paths for data files
DATA_DIR = Path(__file__).parent / "data"
PROJECTS_JSON = DATA_DIR / "projects.json"
SITE_DATA_JSON = DATA_DIR / "site_data.json"


def load_json_data(path, default=None):
    """
    Safely loads JSON data from a given path.
    (Helper function used by the cached functions below)
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

# ==========================================
# Caching Logic (Performance Optimization)
# ==========================================
@lru_cache(maxsize=1)
def get_cached_projects():
    """Reads projects.json once and stores in RAM."""
    return load_json_data(PROJECTS_JSON, default=[])

@lru_cache(maxsize=1)
def get_cached_site_data():
    """Reads site_data.json once and stores in RAM."""
    return load_json_data(SITE_DATA_JSON, default={})


# ==========================================
# Error Handlers
# ==========================================
@portfolio_bp.app_errorhandler(404)
def page_not_found(e):
    """Renders a custom 404 error page."""
    return render_template('404.html'), 404


# ==========================================
# Routes
# ==========================================
@portfolio_bp.route("/", methods=["GET"])
def home():
    """Renders the homepage."""
    # Use Cached Data
    projects = get_cached_projects()
    site_data = get_cached_site_data()

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
    # Use Cached Data
    projects = get_cached_projects()
    return render_template("projects.html", projects=projects)


@portfolio_bp.route("/project/<project_id>", methods=["GET"])
def project_detail(project_id):
    """Renders the dedicated project detail page."""
    # Use Cached Data
    projects = get_cached_projects()
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
        as_attachment=False,
        mimetype="application/pdf",
        download_name=filename
    )


@portfolio_bp.route("/contact", methods=["POST"])
@limiter.limit("2 per minute; 5 per hour") # HR-Friendly Spam Protection
def contact():
    name = (request.form.get("name") or "").strip()
    email = (request.form.get("email") or "").strip()
    message = (request.form.get("message") or "").strip()

    # Explicitly state UTC to avoid confusion
    now = datetime.now().strftime("%d %b %Y | %I:%M %p UTC")

    # Validation
    if not name or not email or len(message) < 10:
        return jsonify({"status": "error", "message": "Valid name, email, and message required."}), 400

    recipient = os.getenv("MAIL_RECIPIENT") or current_app.config.get("MAIL_RECIPIENT")
    mail = current_app.extensions.get("mail")

    try:
        # 1. Notification (To You)
        msg_to_self = Message(
            subject=f"New portfolio message from {name}",
            sender=current_app.config.get("MAIL_DEFAULT_SENDER"),
            recipients=[recipient]
        )
        msg_to_self.reply_to = email
        msg_to_self.html = render_template("emails/notification.html",
                                           name=name, email=email,
                                           message=message, current_time=now)
        mail.send(msg_to_self)

        # 2. Auto-Reply (To Sender)
        msg_to_sender = Message(
            subject="Message Received - Muthukumaran",
            sender=current_app.config.get("MAIL_DEFAULT_SENDER"),
            recipients=[email]
        )
        msg_to_sender.html = render_template("emails/auto_reply.html", name=name)
        mail.send(msg_to_sender)

        return jsonify({"status": "success", "message": "Message sent successfully."}), 200
    except Exception:
        return jsonify({"status": "error", "message": "Failed to send message."}), 500

@portfolio_bp.route("/api/search-data", methods=["GET"])
def get_search_data():
    """
    API endpoint for Command Palette.
    Returns structured data for Pages, Projects, Socials, etc.
    """
    # Use Cached Data
    projects_data = get_cached_projects()
    site_data = get_cached_site_data()

    # 1. Pages
    pages = [
        {"id": "home", "title": "Home", "desc": "Go to Homepage", "url": url_for('portfolio.home'), "icon": "home",
         "group": "Pages", "tokens": "landing index"},
        {"id": "about", "title": "About", "desc": "Read my story", "url": url_for('portfolio.home') + "#about",
         "icon": "user", "group": "Pages", "tokens": "bio profile me"},
        {"id": "projects_section", "title": "Featured Projects", "desc": "View highlighted work",
         "url": url_for('portfolio.home') + "#projects", "icon": "star", "group": "Pages", "tokens": "work portfolio"},
        {"id": "all_projects", "title": "All Projects Archive", "desc": "View full project list",
         "url": url_for('portfolio.all_projects'), "icon": "archive", "group": "Pages", "tokens": "list"},
        {"id": "awards", "title": "Awards", "desc": "Honors & Certifications",
         "url": url_for('portfolio.home') + "#awards", "icon": "award", "group": "Pages", "tokens": "certificates"},
        {"id": "contact", "title": "Contact", "desc": "Get in touch", "url": url_for('portfolio.home') + "#contact",
         "icon": "mail", "group": "Pages", "tokens": "email hire"},
    ]

    # 2. Projects
    all_projects_list = []
    for p in projects_data:
        tags_display = " • ".join(p.get("tags", [])[:3])
        tags_search_str = " ".join(p.get("tags", [])).lower()

        all_projects_list.append({
            "id": f"proj_{p['id']}",
            "title": p['title'],
            "desc": tags_display if tags_display else p.get('role', 'Project'),
            "url": url_for('portfolio.project_detail', project_id=p['id']),
            "icon": "zap",
            "group": "Projects",
            "search_tags": tags_search_str,
            "tokens": p.get("tagline", "").lower()
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
                "external": True,
                "tokens": s.get('handle', '').replace('@', '').lower()
            })

    # 4. Resume
    resume = [{
        "id": "resume",
        "title": "View Resume",
        "desc": "Open PDF in Browser",
        "url": url_for('portfolio.download_resume'),
        "icon": "file-text",
        "group": "Resume",
        "external": True,
        "tokens": "cv pdf download"
    }]

    return jsonify({
        "pages": pages,
        "projects": all_projects_list,
        "connect": socials,
        "resume": resume
    })

@portfolio_bp.route("/legal", methods=["GET"])
def legal():
    """Renders the Legal & Privacy page."""
    return render_template("legal.html")
