# 👨‍💻 Portfolio | Muthukumaran

A high-performance personal portfolio website designed to showcase projects and technical skills. Built with a focus on clean architecture, modern UI (Glassmorphism), and responsiveness.

![Project Preview](/portfolio/static/images/project-portfolio-thumb.png)

## 🚀 Features

* **Backend:** Python & Flask (Application Factory Pattern).
* **Frontend:** HTML5, CSS3 (Variables & Glassmorphism), Vanilla JS (No jQuery).
* **Dynamic Content:** Projects and achievements are loaded from JSON files, allowing instant updates without modifying HTML.
* **UI/UX:**
    * Dark/Light Mode toggle (persists via LocalStorage).
    * Custom "Liquid" cursor and scroll reveal animations.
    * Responsive Grid Layout (Mobile-first approach).
* **Contact:** Functional contact form with `Flask-Mail`, CSRF protection, and asynchronous Toast notifications.

## 🛠️ Tech Stack

* **Core:** Python 3.10+, Flask
* **Styling:** CSS3 (Custom Properties), Lucide Icons
* **Deployment:** Vercel (Serverless)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/flask-portfolio.git](https://github.com/YOUR_USERNAME/flask-portfolio.git)
    cd flask-portfolio
    ```

2.  **Create Virtual Environment**
    ```bash
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Mac/Linux
    source .venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```ini
    SECRET_KEY=your_secret_key
    MAIL_SERVER=smtp.gmail.com
    MAIL_PORT=587
    MAIL_USE_TLS=True
    MAIL_USERNAME=your_email@gmail.com
    MAIL_PASSWORD=your_app_password
    MAIL_DEFAULT_SENDER=your_email@gmail.com
    MAIL_RECIPIENT=your_email@gmail.com
    ```

5.  **Run Locally**
    ```bash
    python app.py
    ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).