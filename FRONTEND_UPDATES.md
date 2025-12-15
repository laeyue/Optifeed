# Frontend Database Integration Updates

## Completed ✓

### 1. API Configuration (config.js)
- Created central API configuration with BASE_URL and ENDPOINTS
- Helper functions for token management (getAuthToken, setAuthToken, removeAuthToken)
- Universal apiRequest() function with JWT authentication
- Added to all HTML pages

### 2. Authentication (auth.js, script.js, signup.html)
- **Login**: Updated to use POST /api/auth/login endpoint
  - Stores JWT token in localStorage
  - Stores user data in localStorage
  - Async/await implementation with error handling
  
- **Signup**: Updated signup form to use POST /api/auth/signup endpoint
  - Creates user in database
  - Proper error handling for duplicate usernames
  - Validates and sends user data to backend

### 3. Sensor Management (user-sensors.js)
- **loadSensors()**: Fetches sensors from GET /api/sensors
- **saveSensor()**: Creates (POST) or updates (PUT) sensors via API
- **calibrateSensor()**: Updates sensor calibration date via API
- **deleteSensor()**: Removes sensor via DELETE /api/sensors/:id
- **renderSensors()**: Updated to work with database field names (sensor_type, location_name, calibration_date, etc.)
- **editSensor()**: Updated to work with database response structure

### 4. Monitoring Charts (monitoring-charts.js)
- **loadSensorData()**: Fetches sensors from API instead of localStorage
- **updateSensorChart()**: Uses API to get latest sensor data
- Both functions properly handle async operations with try/catch

### 5. HTML Files Updated
All pages now include config.js script:
- login.html
- signup.html
- user-sensors.html
- user-monitoring.html
- user-reports.html
- user-dashboard.html
- user-measurements.html
- admin-monitoring.html
- admin-dashboard.html
- admin-users.html
- admin-records.html
- admin-locations.html

## Database Field Mappings

### Sensors
- Frontend (old) → Database (new)
- `type` → `sensor_type`
- `location` → `location_name`
- `calibrationDate` → `calibration_date`
- `calibrationNotes` → `metadata.calibration_notes`
- `createdAt` → `created_at`

### Users
- `idNumber` → `id_number`
- `password` → `password_hash` (bcrypt hashed)

## Still Using localStorage

The following features still use localStorage (not critical for core functionality):

1. **System Events** - The systemEvents array for notifications
2. **Sensor Status Toggle** - Per-operator sensorsStatus settings
3. **User Preferences** - Theme, notifications preferences
4. **Admin User Management** - Admin editing/viewing users (backend endpoints not yet available)
5. **Pellet Records** - Historical measurement data
6. **Measurement Sessions** - Active measurement tracking

## API Endpoints Being Used

### Authentication
- `POST /api/auth/login` - User login with JWT token
- `POST /api/auth/signup` - New user registration

### Sensors
- `GET /api/sensors` - Fetch all sensors (filtered by user role)
- `GET /api/sensors/:id` - Fetch single sensor
- `POST /api/sensors` - Create new sensor
- `PUT /api/sensors/:id` - Update sensor (calibration, status, etc.)
- `DELETE /api/sensors/:id` - Delete sensor

## Testing the Updates

1. **Login**: Test with existing user (testuser/test123)
2. **Signup**: Create a new user account
3. **Sensors**: Add, edit, calibrate, and delete sensors
4. **Monitoring**: View sensor charts with live data from database

## Next Steps (Optional)

If you want to extend the integration further:

1. **User Management API**: Add backend endpoints for:
   - GET /api/users (list all users - admin only)
   - PUT /api/users/:id (update user - admin only)
   - DELETE /api/users/:id (delete user - admin only)

2. **Sensor Readings**: Add frontend for viewing sensor readings:
   - GET /api/sensors/:id/readings
   - POST /api/sensors/:id/readings

3. **Dashboard Statistics**: Create API endpoints for:
   - GET /api/stats/sensors (sensor counts, status breakdown)
   - GET /api/stats/readings (recent readings, averages)

4. **Migration Tool**: Create script to migrate existing localStorage data to database

## Notes

- All API calls include JWT authentication via Authorization header
- Error handling implemented with try/catch blocks
- Backward compatibility maintained where possible
- Console.error() used for debugging failed API calls
