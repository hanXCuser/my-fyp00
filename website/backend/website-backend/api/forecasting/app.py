from flask import Flask, request, jsonify
from predict import predict_next

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    last_values = payload.get("last_values")
    if (
        not isinstance(last_values, list)
        or len(last_values) != 12
        or not all(isinstance(v, (int, float)) for v in last_values)
    ):
        return jsonify(
            {
                "error": "Field 'last_values' must be a list of exactly 12 numeric values"
            }
        ), 400

    result = predict_next(last_values)
    return jsonify({"prediction": result})

if __name__ == "__main__":
    app.run(debug=True)