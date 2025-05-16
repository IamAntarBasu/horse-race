# Horse Race Project

This project consists of three main parts:
- Server (Node.js/Express)
- Client (React)
- Admin (React)

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory with the following content:
```
PORT=5000
MONGODB_URI=your_mongodb_uri_here
```

3. Start the development servers:
```bash
# Start all services
npm run dev

# Or start individual services
npm run start:server
npm run start:client
npm run start:admin
```

## Access Points
- Server: http://localhost:5000
- Client: http://localhost:3000
- Admin: http://localhost:3001

## Project Structure
```
horse-race/
├── server/         # Node.js/Express backend
├── client/         # React client application
├── admin/          # React admin application
└── package.json    # Root package.json for workspace management
``` 