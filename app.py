import os
import json
import re
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment footprints from .env
load_dotenv()

# Configure the Google Generative AI SDK
genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")

app = Flask(__name__)

@app.route("/test-gemini")
def test_gemini():
    try:
        response = model.generate_content("Say hello in one sentence.")
        return response.text
    except Exception as e:
        return f"Configuration Error: {str(e)}", 500

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate")
def generate():
    return render_template("generate.html")

@app.route("/generate-plan", methods=["POST"])
def generate_plan():

    trip = request.json

    print("\n===== /generate-plan called =====")
    print(json.dumps(trip, indent=2))

    if not trip:
        return jsonify({"error": "No data payload received"}), 400

    duration = int(trip.get("duration", 3))
    destination_style = trip.get("destination", "Anywhere")
    budget = trip.get("budget", 50000)
    trip_name = trip.get("tripName", "Fun Getaway")
    interests = trip.get("interests", [])
    notes = trip.get("notes", "None")
    members = trip.get("members", [])

    interests_str = (
        ", ".join(interests)
        if interests else "General Sightseeing"
    )

    destination_examples = {
        "Beach": "Goa, Gokarna, Andaman, Pondicherry",
        "Mountains": "Darjeeling, Manali, Kashmir, Sikkim",
        "Adventure": "Rishikesh, Bir Billing, Ladakh",
        "Culture": "Jaipur, Varanasi, Hampi",
        "Nature": "Munnar, Coorg, Meghalaya"
    }

    suggestions = destination_examples.get(
        destination_style,
        "Any suitable Indian destination"
    )

    members_profile = ""

    for idx, member in enumerate(members):

        member_interests = ", ".join(
            member.get("interests", [])
        )

        members_profile += (
            f"- {member.get('name','Traveler')} "
            f"(Budget: ₹{member.get('budget',0)}, "
            f"Interests: {member_interests})\n"
        )

    prompt = f"""
You are Planora, an expert AI travel planner.

TRIP DETAILS

Trip Name:
{trip_name}

Travel Style:
{destination_style}

Possible Destinations:
{suggestions}

Duration:
{duration} days

Total Budget:
₹{budget}

Group Interests:
{interests_str}

Members:
{members_profile if members_profile else "General Travel Group"}

Additional Notes:
{notes}

RULES:

1. Select the MOST suitable destination.
2. Different inputs MUST produce different itineraries.
3. Explain WHY this destination was chosen.
4. Use REAL places and activities.
5. Stay within the budget.
6. Balance activities according to member interests.
7. Create EXACTLY {duration} days.
8. Each day must contain:
   - morning
   - afternoon
   - evening
9. Return ONLY JSON.
10. No markdown.

Return EXACTLY this structure:

{{
    "destination": "",
    "why_this_destination": "",
    "summary": "",
    "days": [
        {{
            "day": 1,
            "title": "",
            "morning": "",
            "afternoon": "",
            "evening": ""
        }}
    ],
    "packing_list": [],
    "budget_breakdown": {{
        "accommodation": "",
        "food": "",
        "transport": "",
        "activities": ""
    }}
}}
"""

    try:

        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 1.0,
                "top_p": 0.95,
                "top_k": 40
            }
        )

        raw_text = response.text.strip()

        print("\n===== GEMINI RESPONSE =====")
        print(raw_text)

        cleaned_text = re.sub(
            r"^```json\s*|```$",
            "",
            raw_text
        ).strip()

        plan = json.loads(cleaned_text)

        return jsonify(plan)

    except json.JSONDecodeError:

        print("JSON parsing failed.")

        return jsonify({
            "error": "Gemini returned invalid JSON.",
            "raw_response": raw_text
        }), 500

    except Exception as e:

        print("Gemini Error:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
if __name__ == "__main__":
    app.run(debug=True)