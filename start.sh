#!/bin/bash

echo "Starting Cost Estimation Application..."
echo

echo "Starting Backend Server..."
cd server
npm run dev &
SERVER_PID=$!

echo "Starting Frontend Application..."
cd ../client
npm start &
CLIENT_PID=$!

echo
echo "All services are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
