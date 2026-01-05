"""
Sync Script (The "Snapshot" Tool)
Run this locally to fetch data from MongoDB and save it as JSON files.
Usage: python sync_db.py
"""
import os
import json
from pymongo import MongoClient
from dotenv import load_dotenv

# Load your .env file to get the connection string
load_dotenv()

# --- Configurations ---
# Ensure your .env has MONGO_URI="mongodb+srv://..."
MONGO_URI = os.getenv("MONGO_URI")

# Path to save the JSON files: portfolio/data/
DATA_DIR = os.path.join("portfolio", "data")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)


def fetch_and_save():
    if not MONGO_URI:
        print("❌ Error: MONGO_URI not found in .env file.")
        return

    print("🔌 Connecting to MongoDB...")
    try:
        client = MongoClient(MONGO_URI)
        db = client.portfolio_db

        # 1. Fetch Projects
        print("📥 Fetching Projects...")
        projects = list(db.projects.find({}, {"_id": 0}))

        # Save projects.json
        with open(os.path.join(DATA_DIR, "projects.json"), "w", encoding="utf-8") as f:
            json.dump(projects, f, indent=2)
        print("✅ Saved projects.json")

        # 2. Fetch Site Data (Hero, Tech, Achievements)
        print("📥 Fetching Site Data...")
        hero = db.hero.find_one({}, {"_id": 0}) or {}
        tech_stack = list(db.tech_stack.find({}, {"_id": 0}))
        achievements = list(db.achievements.find({}, {"_id": 0}))

        # Construct the site_data object structure
        site_data = {
            "hero": hero,
            "socials": hero.get("socials", []),
            "tech_stack": tech_stack,
            "achievements": achievements,
            "about": {
                "title": "About Me",
                "content": "I’m an <strong>M.Sc. Computer Science graduate</strong> passionate about building impactful software. Beyond academics, I expand my skills through hands-on coding and practical projects.<br><br>Curious and driven, I am ready to deliver purpose-driven code as a professional developer.",
                "status": "Open to Work"
            }
        }

        # Save site_data.json
        with open(os.path.join(DATA_DIR, "site_data.json"), "w", encoding="utf-8") as f:
            json.dump(site_data, f, indent=2)
        print("✅ Saved site_data.json")

        print("\n🎉 Sync Complete! Now run 'python app.py' to see changes.")

    except Exception as e:
        print(f"❌ Error during sync: {e}")


if __name__ == "__main__":
    fetch_and_save()
