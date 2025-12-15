# OptiFeed Backend API

Backend server for the OptiFeed Sensor Monitoring System built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v16 or later)
- PostgreSQL (v12 or later)
- npm or yarn

## Installation

1. **Navigate to backend directory:**
```powershell
cd backend
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Set up environment variables:**
```powershell
# Copy example env file
Copy-Item .env.example .env

# Edit .env file and update with your settings
notepad .env
```

Update these critical values in `.env`:
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_SECRET` - Change to a random secure string
- `FRONTEND_URL` - Update if using different port

4. **Ensure database is set up:**
Make sure you've run the database schema first:
```powershell
cd ..
psql -U postgres -d optifeed -f database/schema.sql
```

## Running the Server

### Development mode (with auto-reload):
```powershell
npm run dev
```

### Production mode:
```powershell
npm start
```

Server will start on `http://localhost:3000` (or port specified in .env)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Sensors
- `GET /api/sensors` - Get all sensors (filtered by user)
- `GET /api/sensors/:id` - Get single sensor
- `POST /api/sensors` - Create new sensor
- `PUT /api/sensors/:id` - Update sensor
- `DELETE /api/sensors/:id` - Delete sensor
- `GET /api/sensors/:id/readings` - Get sensor readings
- `POST /api/sensors/:id/readings` - Add sensor reading

### System
- `GET /api/health` - Health check
- `GET /` - API information

## Authentication

All endpoints except `/api/auth/*` and `/` require JWT authentication.

Include token in request headers:
```
Authorization: Bearer <your_jwt_token>
```

## Testing the API

### Using PowerShell:

**Login:**
```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token
```

**Get sensors:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/sensors" -Method GET -Headers $headers
```

### Using cURL:

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get sensors:**
```bash
curl http://localhost:3000/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend Integration

Update your frontend JavaScript files to use the API instead of localStorage.

Example login function:
```javascript
async function login(username, password) {
    const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
    }
    throw new Error(data.error);
}
```

## Project Structure

```
backend/
├── config/
│   └── database.js       # Database connection
├── middleware/
│   └── auth.js          # Authentication middleware
├── routes/
│   ├── auth.js          # Authentication routes
│   └── sensors.js       # Sensor routes
├── .env.example         # Environment variables template
├── server.js            # Main server file
└── package.json         # Dependencies
```

## Security Notes

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Change JWT_SECRET** - Use a strong random string
3. **Use HTTPS in production** - Never send passwords over HTTP
4. **Hash all passwords** - Currently using bcrypt with 10 rounds
5. **Implement rate limiting** - Configured for 100 requests per 15 minutes

## Troubleshooting

### Port already in use:
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

### Database connection error:
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### CORS errors:
- Update `FRONTEND_URL` in `.env` to match your frontend
- Ensure frontend is running on the specified URL

## Next Steps

1. Start the backend server
2. Update frontend auth.js to use API endpoints
3. Test login/signup functionality
4. Migrate sensor data from localStorage to database
5. Update charts to fetch from API

## Support

For issues or questions, refer to the main project documentation or database setup guide.
