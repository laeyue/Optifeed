# OptiFeed

OptiFeed is a pellet measurement system (backend + frontend).

## Quick start

1. Backend

```powershell
cd backend
npm install
# Create a .env file with DB and JWT settings
node server.js
```

2. Frontend

Open the HTML files in your browser (or serve root with the backend running).

## Notes
- Add sensitive keys to `.env` and do not commit them.
- Backend uses PostgreSQL — configure connection in `backend/.env`.
- Admin pages require an admin user; signup with the API or seed the DB.

