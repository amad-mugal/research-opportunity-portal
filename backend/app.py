import os
from datetime import date

import mysql.connector
from flask import Flask, jsonify, request, send_from_directory
from mysql.connector import Error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__, static_folder=os.path.join(ROOT, "frontend"), static_url_path="")

REQUIRED = ["title", "description", "research_area", "faculty_name", "department",
            "required_skills", "positions", "deadline", "status"]

def db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "research_portal"),
    )

def response_error(message, status):
    return jsonify({"error": message}), status

def validate_opportunity(data, partial=False):
    if not isinstance(data, dict):
        return "Request body must be a JSON object."
    unknown = [field for field in data if field not in REQUIRED]
    if unknown:
        return "Unknown field(s): " + ", ".join(unknown)
    missing = [field for field in REQUIRED if field not in data] if not partial else []
    if missing:
        return "Missing required fields: " + ", ".join(missing)
    fields = REQUIRED if not partial else [field for field in REQUIRED if field in data]
    for field in fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            return f"{field} cannot be empty."
    if "positions" in data:
        try:
            positions = int(data["positions"])
            if positions < 1:
                return "positions must be a whole number greater than zero."
            data["positions"] = positions
        except (ValueError, TypeError):
            return "positions must be a whole number greater than zero."
    if "deadline" in data:
        try:
            date.fromisoformat(data["deadline"])
        except (ValueError, TypeError):
            return "deadline must use YYYY-MM-DD format."
    if "status" in data and data["status"] not in ("Open", "Closed"):
        return "status must be Open or Closed."
    return None

def query(sql, values=(), fetch=False):
    connection = db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, values)
        result = cursor.fetchall() if fetch else cursor.lastrowid
        if not fetch:
            connection.commit()
        cursor.close()
        return result
    finally:
        connection.close()

@app.errorhandler(Error)
def database_error(error):
    app.logger.exception("Database request failed")
    return response_error("Database error. Check that MySQL is running and configured; see README.md.", 500)

@app.errorhandler(500)
def server_error(error):
    return response_error("Internal server error.", 500)

@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.get("/api/opportunities")
def list_opportunities():
    records = query("SELECT * FROM opportunities ORDER BY id DESC", fetch=True)
    return jsonify(records), 200

@app.post("/api/opportunities")
def create_opportunity():
    data = request.get_json(silent=True)
    if data is None:
        return response_error("Send a valid JSON request body.", 400)
    problem = validate_opportunity(data)
    if problem:
        return response_error(problem, 400)
    fields = ", ".join(REQUIRED)
    marks = ", ".join(["%s"] * len(REQUIRED))
    values = [data[field] for field in REQUIRED]
    record_id = query(f"INSERT INTO opportunities ({fields}) VALUES ({marks})", values)
    record = query("SELECT * FROM opportunities WHERE id = %s", (record_id,), fetch=True)[0]
    return jsonify(record), 201

@app.get("/api/opportunities/<int:record_id>")
def get_opportunity(record_id):
    rows = query("SELECT * FROM opportunities WHERE id = %s", (record_id,), fetch=True)
    if not rows:
        return response_error("Opportunity not found.", 404)
    return jsonify(rows[0]), 200

@app.put("/api/opportunities/<int:record_id>")
def update_opportunity(record_id):
    data = request.get_json(silent=True)
    if data is None:
        return response_error("Send a valid JSON request body.", 400)
    if not data:
        return response_error("Provide at least one field to update.", 400)
    problem = validate_opportunity(data, partial=True)
    if problem:
        return response_error(problem, 400)
    if not query("SELECT id FROM opportunities WHERE id = %s", (record_id,), fetch=True):
        return response_error("Opportunity not found.", 404)
    assignments = ", ".join(f"{field} = %s" for field in data)
    query(f"UPDATE opportunities SET {assignments} WHERE id = %s", list(data.values()) + [record_id])
    updated = query("SELECT * FROM opportunities WHERE id = %s", (record_id,), fetch=True)[0]
    return jsonify(updated), 200

@app.delete("/api/opportunities/<int:record_id>")
def delete_opportunity(record_id):
    if not query("SELECT id FROM opportunities WHERE id = %s", (record_id,), fetch=True):
        return response_error("Opportunity not found.", 404)
    query("DELETE FROM opportunities WHERE id = %s", (record_id,))
    return jsonify({"message": "Opportunity deleted successfully."}), 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)