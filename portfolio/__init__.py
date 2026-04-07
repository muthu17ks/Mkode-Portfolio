"""
Portfolio Blueprint Setup.

Initializes the main Blueprint for the portfolio application, linking
templates and static assets. Also initializes the Rate Limiter to avoid
circular imports.
"""

from flask import Blueprint
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

portfolio_bp = Blueprint(
    "portfolio",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/portfolio/static"
)

from . import routes
