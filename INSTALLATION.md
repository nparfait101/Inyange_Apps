# Installation Guide for InyangeApps

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Step 1: Install Dependencies

Navigate to the project root and install backend dependencies:

```bash
npm install
```

Then install frontend dependencies:

```bash
cd client
npm install
cd ..
```

Or use the convenience script:

```bash
npm run install-all
```

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

2. Edit `.env` and update the following variables:

```
MONGODB_URI=mongodb://localhost:27017/inyange-apps
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=development
```

**Important:** 
- Replace `your_super_secret_jwt_key_change_this_in_production` with a strong, random secret key
- If using MongoDB Atlas, replace the `MONGODB_URI` with your Atlas connection string

## Step 3: Start MongoDB

If using a local MongoDB installation, make sure MongoDB is running:

```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

## Step 4: Run the Application

### Development Mode

Run both backend and frontend concurrently:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend application on http://localhost:3000

### Production Mode

1. Build the frontend:

```bash
cd client
npm run build
cd ..
```

2. Start the backend:

```bash
npm start
```

## Step 5: Access the Application

1. Open your browser and navigate to http://localhost:3000
2. Register a new account or login with existing credentials
3. The first user registered will have `user` role by default
4. To create an administrator, update the user's role in MongoDB or use the admin panel (if implemented)

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check that the connection string in `.env` is correct
- Verify network connectivity if using MongoDB Atlas

### Port Already in Use

If port 5000 or 3000 is already in use:

1. Change `PORT` in `.env` for backend
2. Update `NEXT_PUBLIC_API_URL` accordingly
3. For frontend, modify `package.json` scripts or use `PORT=3001 npm run dev`

### Module Not Found Errors

- Delete `node_modules` folders and `package-lock.json`
- Run `npm install` again in both root and client directories

## Next Steps

1. Create your first administrator account
2. Configure user permissions as needed
3. Upload customers and products for the Sales module (if applicable)
4. Customize approval flows for your organization

## Support

For issues or questions, please refer to the README.md or contact your system administrator.
