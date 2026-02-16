# InyangeApps

A comprehensive request management and sales operations system for Inyange Industries.

## Features

- **Request Management**: Travel, Fuel & Vehicle, and Petty Cash requests with multi-step approval flows
- **Sales Orders Tracking**: End-to-end order tracking from creation to delivery
- **Gate Pass Management**: Canteen and general gate pass system
- **Role-Based Access Control**: Users, Administrators, and Finance staff roles
- **Dark Mode**: Toggle between light and dark themes (default: light)
- **Responsive Design**: Modern UI/UX with Inyange Industries blue theme

## Tech Stack

- **Frontend**: Next.js 14 (React)
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT tokens

## Installation

1. Install dependencies:
```bash
npm run install-all
```

2. Create a `.env` file in the root directory:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
inyange-apps/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and helpers
│   │   └── styles/       # Global styles
│   └── public/           # Static assets
├── server/                # Express backend
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── controllers/     # Request handlers
│   └── config/          # Configuration files
└── package.json
```

## Modules

1. **Travel Requests**: Employee travel request management
2. **Fuel & Vehicle Requests**: Fuel and vehicle request system
3. **Petty Cash**: Petty cash request and approval
4. **Sales Orders**: Complete sales order tracking workflow
5. **Gate Pass**: Canteen and general gate pass management

## License

ISC
