"""
Portfolio Blueprint Setup.

Initializes the main Blueprint for the portfolio application, linking
templates and static assets.
"""

from flask import Blueprint

# Initialize the Blueprint
portfolio_bp = Blueprint(
    "portfolio",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/portfolio/static"
)

# Import routes to register them with the blueprint
from . import routes
