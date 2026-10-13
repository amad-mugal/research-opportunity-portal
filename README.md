# Research Opportunity Portal

A small full-stack project for the FAST-NUCES Computer Networks assignment. It uses a Python/Flask REST API, MySQL, and a plain HTML/CSS/JavaScript frontend. All opportunity records are read from and written to MySQL through the API; the browser contains no sample project data.

## Features

- Create, list, view, update, and delete research opportunities.
- Fields: unique ID, title, description, research area, faculty member, department, skills, positions, deadline, and Open/Closed status.
- Change status from the details panel; required fields and values are validated in the browser and API.
- REST responses use 200, 201, 400, 404, and 500 where appropriate.
- Postman collection demonstrates the required sequence, including three creates, update, close, delete, deleted-record 404, and invalid-data 400.

## Requirements

- macOS with Python 3.10 or newer.
- MySQL Community Server installed and running.
- Postman (optional).

## Setup on macOS

1. Open Terminal and change directory to this project folder.
2. Create a Python virtual environment and install packages:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cd ..
   ```

3. Create the database and table. The SQL file creates `research_portal` and `opportunities`:

   ```bash
   mysql -u root -p < backend/schema.sql
   ```

   Enter your local MySQL root password when prompted.

4. Set database connection variables in the terminal where you will run the API. For a passwordless local root account, omit `DB_PASSWORD` or set it to an empty value. Example:

   ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_USER=root
   export DB_PASSWORD=''
   export DB_NAME=research_portal
   ```

5. Start the backend from the project root:

   ```bash
   source backend/.venv/bin/activate
   python backend/app.py
   ```

   The API and frontend are served together at <http://127.0.0.1:5000>. Keep this terminal running.

6. Open <http://127.0.0.1:5000> in a browser. Use the form to create a project, select a card to see full details, then edit, close/reopen, or delete it. You can refresh the page to confirm records persist in MySQL.

## REST API

Base URL: `http://127.0.0.1:5000`

| Method | Path | Result |
|---|---|---|
| POST | `/api/opportunities` | Create; 201 Created |
| GET | `/api/opportunities` | List all; 200 OK |
| GET | `/api/opportunities/<id>` | Get details; 200 OK or 404 Not Found |
| PUT | `/api/opportunities/<id>` | Update supplied fields; 200 OK, 400 Bad Request, or 404 Not Found |
| DELETE | `/api/opportunities/<id>` | Delete; 200 OK or 404 Not Found |

Create requires all fields. `positions` must be a positive whole number, `deadline` uses `YYYY-MM-DD`, and `status` is `Open` or `Closed`. PUT accepts one or more valid fields, so status can be changed on its own. Invalid JSON or invalid/missing data returns 400 with an `error` message. Unexpected/database errors return 500.

Example create body:

```json
{
  "title": "Vision for Crop Health",
  "description": "Identify crop leaf disease from images.",
  "research_area": "Computer Vision",
  "faculty_name": "Dr. Sara Khan",
  "department": "Computer Science",
  "required_skills": "Python, image processing",
  "positions": 2,
  "deadline": "2026-03-31",
  "status": "Open"
}
```

## Postman test walkthrough

1. Ensure MySQL and the Flask server are running.
2. In Postman, choose **Import**, select `postman/Research-Opportunity-Portal.postman_collection.json`, then open the collection.
3. Run requests from **1** through **10** in order (or use **Run collection** in that order). The first create stores its generated ID in collection variables for the later get/update/close/delete/404 requests.
4. Confirm the tests show 201 for creates, 200 for normal reads/updates/deletion, 404 after deleting, and 400 for invalid data. Every run inserts three new rows; that is expected. To start from an empty table, run `DELETE FROM opportunities;` in MySQL Workbench or the MySQL client.

## GitHub and meaningful commits

My own public GitHub repository:

`GitHub Repository: <https://github.com/amad-mugal/research-opportunity-portal.git>`

## One-minute demo video

Keeping the recording to 60 seconds or less and showing the running app:

`Demonstration video: <https://drive.google.com/file/d/1KfLKhGfMl1tx4O65hFFCpnoHQ7VhT6KQ/view?usp=share_link>`
