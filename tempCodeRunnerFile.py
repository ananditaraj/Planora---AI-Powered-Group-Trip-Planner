from flask import (
    Flask,
    render_template,
    request,
    jsonify
)

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate")
def generate():
    return render_template("generate.html")

@app.route("/generate-plan", methods=["POST"])
def generate_plan():
    trip_data = request.json
    print("Received Trip Data Payload:", trip_data)

    # Simulated AI responses based on incoming user configuration
    destination = trip_data.get("destination", "Goa")
    
    activities = [
        "Beach hopping along the coastline",
        "Local Konkani food & spice farm tours",
        "Water sports and scuba adventures",
        "Sunset luxury cruise experience"
    ]

    # Build a simple human-readable plan summary for the frontend
    plan_text = (
        f"A {trip_data.get('duration', 0)}-day trip to {destination} with a budget of "
        f"₹{trip_data.get('budget', 0)}. Recommended activities: {', '.join(activities)}."
    )

    return jsonify({
        "destination": destination,
        "duration": trip_data.get("duration", 0),
        "budget": trip_data.get("budget", 0),
        "activities": activities,
        "plan": plan_text
    })

if __name__ == "__main__":
    app.run(debug=True)