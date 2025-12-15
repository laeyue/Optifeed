# Testing Guide - Database Integration

## Prerequisites
- Backend server running on `http://localhost:3000`
- Database connected and schema loaded
- Frontend served (e.g., via Live Server on port 5500)

## Test Scenarios

### 1. User Signup ✓
**Steps:**
1. Navigate to `signup.html`
2. Fill in the form:
   - Name: Test User 2
   - Username: testuser2
   - Password: test123
   - Email: testuser2@example.com
   - Phone: (optional)
   - Location: (optional)
3. Click "Sign Up"

**Expected Result:**
- Success message: "Account created successfully! Please login."
- Redirects to login.html
- User created in database with hashed password

**API Call:** `POST /api/auth/signup`

---

### 2. User Login ✓
**Steps:**
1. Navigate to `login.html`
2. Enter credentials:
   - Username: testuser (or testuser2)
   - Password: test123
3. Click "Login"

**Expected Result:**
- JWT token stored in localStorage as 'authToken'
- User data stored in localStorage as 'userData'
- Redirects to user-dashboard.html

**API Call:** `POST /api/auth/login`

---

### 3. View Sensors ✓
**Steps:**
1. Login as a user
2. Navigate to "Sensors" page (user-sensors.html)

**Expected Result:**
- Loads sensors from database
- Displays sensor cards with:
  - Sensor name
  - Type (Camera, Temperature, etc.)
  - Location
  - Calibration date
  - Status badge (online/offline)

**API Call:** `GET /api/sensors`

---

### 4. Add New Sensor ✓
**Steps:**
1. On Sensors page, click "Add Sensor"
2. Fill in the form:
   - Name: Test Sensor
   - Type: Select one (camera, temperature, etc.)
   - Location: Test Location
   - Calibration Date: (select date)
   - Notes: Initial calibration
3. Click "Save"

**Expected Result:**
- Sensor created in database
- New sensor card appears in grid
- Success message (if implemented)

**API Call:** `POST /api/sensors`

**Database:**
```sql
SELECT * FROM sensors WHERE name = 'Test Sensor';
```

---

### 5. Edit Sensor ✓
**Steps:**
1. On Sensors page, click "Edit" on any sensor
2. Modify fields (name, location, status, etc.)
3. Click "Save"

**Expected Result:**
- Sensor updated in database
- Changes reflected in sensor card
- Status toggle works (online/offline)

**API Call:** `PUT /api/sensors/:id`

---

### 6. Calibrate Sensor ✓
**Steps:**
1. On Sensors page, click "Calibrate" on any sensor
2. Confirm action

**Expected Result:**
- Calibration date updated to today
- Sensor status set to "online"
- Success alert message
- "Last Calibration: Calibrated today" displayed

**API Call:** `PUT /api/sensors/:id`

---

### 7. Delete Sensor ✓
**Steps:**
1. On Sensors page, click "Delete" on any sensor
2. Confirm deletion in alert

**Expected Result:**
- Sensor removed from database
- Sensor card disappears from grid
- Other sensors remain unaffected

**API Call:** `DELETE /api/sensors/:id`

---

### 8. Monitoring Charts ✓
**Steps:**
1. Login as user
2. Navigate to "Monitoring" page (user-monitoring.html)

**Expected Result:**
- Sensor chart loads with data from database
- Shows bars for each sensor
- Activity percentage reflects sensor status
- Updates every 3 seconds

**API Call:** `GET /api/sensors`

---

## Debugging

### Check Backend Logs
Look for API requests in terminal running the backend:
```
POST /api/auth/login 200 45ms
GET /api/sensors 200 12ms
POST /api/sensors 201 35ms
```

### Check Browser Console
Open DevTools (F12) → Console tab
- Look for errors or failed API calls
- Check network tab for HTTP requests
- Verify JWT token is being sent: `Authorization: Bearer <token>`

### Check Database
```sql
-- View all users
SELECT id, username, name, role, created_at FROM users;

-- View all sensors
SELECT id, name, sensor_type, status, username, created_at FROM sensors;

-- View sensor readings
SELECT sr.*, s.name as sensor_name 
FROM sensor_readings sr 
JOIN sensors s ON sr.sensor_id = s.id 
ORDER BY timestamp DESC 
LIMIT 10;

-- View audit log
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 20;
```

### Common Issues

**1. "Failed to load sensors"**
- Check if backend server is running
- Verify JWT token exists: `localStorage.getItem('authToken')`
- Check CORS settings in backend

**2. "401 Unauthorized"**
- Token expired or invalid
- Logout and login again
- Check if token is being sent in Authorization header

**3. "Network error"**
- Backend not running on port 3000
- CORS blocking requests
- Check frontend URL matches FRONTEND_URL in backend .env

**4. Changes not saving**
- Check backend logs for errors
- Verify database connection
- Check if user has permission (role-based access)

## Success Indicators

✓ All API calls return 200/201/204 status codes
✓ Data persists after page refresh
✓ Multiple users can have separate sensors
✓ JWT authentication working
✓ Database tables populated correctly
✓ Audit log recording actions

## Rollback (if needed)

If you need to go back to localStorage version:
1. Remove or comment out config.js script from HTML files
2. Restore old versions of:
   - auth.js
   - user-sensors.js
   - monitoring-charts.js
   - signup.html

(Or use git to revert changes)
