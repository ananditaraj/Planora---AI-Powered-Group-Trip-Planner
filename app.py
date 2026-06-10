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

    print(trip_data)

    return jsonify({
        "plan":
        f"""
        Recommended Destination:
        Goa

        Duration:
        {trip_data.get('duration', 'N/A')} Days

        Budget:
        ₹{trip_data.get('budget', 'N/A')}

        Suggested Activities:
        Beach hopping,
        local food tours,
        water sports,
        sunset cruise.
        """
    })


if __name__ == "__main__":
    app.run(debug=True)