@echo off
echo Starting Salon App...

:: Start Backend
cd backend
start cmd /k "npm install && npm start"

:: Start Frontend
cd ../frontend
start cmd /k "npm install && npm start"

echo Services are starting...
echo Frontend will be available at http://localhost:5173
echo Backend will be available at http://localhost:3000

:: Return to root directory
cd .. 