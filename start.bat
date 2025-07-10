@echo off
echo Starting Cost Estimation Application...
echo.

echo Starting MongoDB...
start "MongoDB" cmd /k "mongod"

timeout /t 3 /nobreak > nul

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Application...
start "Frontend" cmd /k "cd /d %~dp0client && npm start"

echo.
echo All services are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
