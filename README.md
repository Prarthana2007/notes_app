# Margin Notes

A full-stack notes app built with React, Vite, Express, and MongoDB. Notes are stored in MongoDB, so they remain available after a browser refresh.

## Requirements

- Node.js 20 or newer and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## 1. Install dependencies

Open a terminal in `06/backend` and run:

```powershell
npm install
```

Open a second terminal in `06/frontend` and run:

```powershell
npm install
```

## 2. Configure MongoDB

For a local MongoDB Community Server installation, start the MongoDB service, then in `06/backend` run:

```powershell
Copy-Item .env.example .env
```

The example uses `mongodb://127.0.0.1:27017/notes_application`. The database and collection are created automatically when the first note is saved.

For MongoDB Atlas, create a cluster and database user, allow your IP address in Network Access, and replace `MONGO_URI` in `backend/.env` with the Atlas connection string. URL-encode special characters in the database username or password. Keep `.env` private; it is ignored by Git.

## 3. Start the backend

From `06/backend`:

```powershell
npm start
```

Expected startup output includes `MongoDB connected: notes_application` and `Server running on port 5000`. Verify the API at <http://localhost:5000/api/health>.

## 4. Start the frontend

In another terminal, from `06/frontend`:

```powershell
npm run dev
```

Open the URL Vite prints, normally <http://localhost:5173>. Vite forwards `/api` requests to `http://localhost:5000`.

## 5. Add sample notes for screenshots

With MongoDB configured, from `06/backend` run:

```powershell
npm run seed
```

The seed command inserts three sample notes only when the database is empty. This makes the main interface screenshot-ready without putting mock data in the frontend.

## 6. Test CRUD and persistence

With the backend and MongoDB running, from `06/backend` run these PowerShell commands:

```powershell
$note = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/notes -ContentType 'application/json' -Body (@{ title = 'Persistence check'; content = 'Saved in MongoDB'; color = 'sage' } | ConvertTo-Json)
$note
Invoke-RestMethod -Uri "http://localhost:5000/api/notes/$($note._id)"
Invoke-RestMethod -Method Put -Uri "http://localhost:5000/api/notes/$($note._id)" -ContentType 'application/json' -Body (@{ title = 'Persistence check updated'; content = 'Update is stored'; color = 'sky' } | ConvertTo-Json)
Invoke-RestMethod -Uri 'http://localhost:5000/api/notes?search=Persistence'
Invoke-RestMethod -Method Delete -Uri "http://localhost:5000/api/notes/$($note._id)"
```

For a browser persistence check, create and save a note in the frontend, refresh the page, and confirm it is still listed. To verify database records using `mongosh`:

```javascript
use notes_application
db.notes.find()
```

## API

- `GET /api/health` reports server and database status.
- `GET /api/notes?search=term` lists notes, optionally matching title or content.
- `GET /api/notes/:id` retrieves one note.
- `POST /api/notes` creates a note.
- `PUT /api/notes/:id` updates a note.
- `DELETE /api/notes/:id` deletes a note.

Titles are required and limited to 100 characters; content is limited to 10,000 characters. Supported note colors are `paper`, `sage`, `peach`, `sky`, and `lilac`.