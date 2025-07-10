# Quick Setup Guide for Cost Estimation Application

## Prerequisites Check

Before starting, ensure you have:

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - Check version: `node --version`

2. **MongoDB** (version 4.4 or higher)
   - Download from: https://www.mongodb.com/try/download/community
   - Start MongoDB service
   - Check if running: `mongod --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## Quick Start (Windows)

1. **Double-click `start.bat`** in the root directory
   - This will automatically start MongoDB, Backend, and Frontend

## Manual Start

### Option 1: Using Terminal/Command Prompt

1. **Start MongoDB** (if not already running)
   ```bash
   mongod
   ```

2. **Start Backend Server** (in a new terminal)
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Start Frontend** (in another new terminal)
   ```bash
   cd client
   npm install
   npm start
   ```

### Option 2: Using VS Code

1. Open the project in VS Code
2. Open Terminal (Ctrl + `)
3. Run the tasks:
   - Use Ctrl+Shift+P → "Tasks: Run Task" → "Start Server"
   - Use Ctrl+Shift+P → "Tasks: Run Task" → "Start Client"

## Initial Setup

1. **Seed Database** (optional - creates sample data)
   ```bash
   cd server
   npm run seed
   ```

2. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Login Credentials (if you ran the seed script)

- **Admin**: admin@costestimation.com / admin123
- **Trader**: trader@costestimation.com / trader123  
- **Customer**: customer@costestimation.com / customer123

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Kill existing processes: `taskkill /F /IM node.exe`
   - Change ports in .env (backend) or package.json (frontend)

2. **MongoDB Connection Error**
   - Ensure MongoDB is running: `mongod`
   - Check MongoDB URI in server/.env

3. **Module Not Found**
   - Delete node_modules and package-lock.json
   - Run `npm install` again

4. **Permission Denied**
   - Run terminal as Administrator
   - Or use `sudo` on Mac/Linux

### Checking Services

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Frontend Access**
   - Open http://localhost:3000 in browser

3. **MongoDB Status**
   ```bash
   mongo --eval "db.adminCommand('ismaster')"
   ```

## Development Tips

1. **Hot Reloading**: Both frontend and backend support hot reloading
2. **API Testing**: Use Postman or curl to test API endpoints
3. **Database Viewer**: Use MongoDB Compass to view database
4. **Logs**: Check terminal outputs for error messages

## File Structure

```
cost-estimation/
├── client/          # React frontend (port 3000)
├── server/          # Node.js backend (port 5000)
├── start.bat        # Windows startup script
├── start.sh         # Unix startup script
└── README.md        # Main documentation
```

## Next Steps

1. Register your first admin user
2. Create trader accounts
3. Add brands and items
4. Start creating estimates!

## Need Help?

- Check the main README.md for detailed documentation
- Look at the console output for error messages
- Ensure all prerequisites are properly installed
