# CRMS - Construction Resource Management System

A comprehensive full-stack web application for managing construction projects, resources, materials, equipment, employees, and procurement processes.

## 🚀 Features

### Role-Based Dashboards
- **Project Manager Dashboard**: Budget tracking, project progress, resource utilization, pending approvals
- **Site Supervisor Dashboard**: Daily activity, material stock levels, equipment usage, timesheets
- **Procurement Officer Dashboard**: Purchase requests, purchase orders, supplier management, delivery tracking

### Core Modules
- ✅ **Projects Management**: Create, update, and track construction projects
- ✅ **Materials Management**: Catalog and manage construction materials
- ✅ **Inventory Tracking**: Real-time inventory levels with low stock alerts
- ✅ **Equipment Management**: Track equipment deployment and maintenance
- ✅ **Employee Management**: Manage employees and project assignments
- ✅ **Purchase Requests**: Create and approve material purchase requests
- ✅ **Purchase Orders**: Convert approved PRs to POs and track deliveries
- ✅ **Timesheets**: Employee time tracking and approval workflow
- ✅ **Expenses**: Track project expenses and budget monitoring
- ✅ **Suppliers**: Manage supplier information
- ✅ **Notifications**: Real-time alerts for approvals, low stock, budget overruns

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Redux Toolkit
- TailwindCSS
- Recharts (for data visualization)
- Axios

### Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- Joi Validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (via XAMPP or standalone)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cracker38/CRMS-Construction-Resources-Management-System-.git
   cd CRMS-Construction-Resources-Management-System-
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Database Setup**
   - Start MySQL server (XAMPP or standalone)
   - Create a database named `crms`
   - Import the schema:
     ```bash
     mysql -u root -p crms < database/schema.sql
     ```
   - Or run the seed script:
     ```bash
     cd backend
     node seed-database.js
     ```

4. **Environment Configuration**
   
   Create `backend/.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=crms
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   ```

   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Run the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev:all
   
   # Or run separately:
   npm run dev:backend  # Backend on http://localhost:5000
   npm run dev:frontend # Frontend on http://localhost:5173
   ```

## 👥 Default Users

After seeding the database, you can login with:

- **Admin**: admin@crms.com / password123
- **Project Manager**: pm@crms.com / password123
- **Site Supervisor**: ss@crms.com / password123
- **Procurement Officer**: po@crms.com / password123

## 📁 Project Structure

```
CRMS/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store
│   │   └── utils/       # API utilities
│   └── vite.config.js
├── database/
│   └── schema.sql       # Database schema
└── package.json
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/users` - Get all users (for dropdowns)

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Materials, Equipment, Employees, etc.
- Similar CRUD endpoints for all modules

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set build command: `cd frontend && npm run build`
   - Set output directory: `frontend/dist`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`

3. **Deploy to Netlify**
   - Connect your GitHub repository
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`

### Backend Deployment (Railway/Render/Heroku)

1. **Prepare for deployment**
   - Update CORS settings in `backend/server.js` to allow your frontend domain
   - Set environment variables on your hosting platform

2. **Deploy to Railway**
   - Connect GitHub repository
   - Set root directory: `backend`
   - Add environment variables from `backend/.env`
   - Railway will auto-detect Node.js and deploy

3. **Deploy to Render**
   - Create new Web Service
   - Connect GitHub repository
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables

4. **Deploy to Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set DB_HOST=your_db_host
   # Add all other env variables
   git push heroku main
   ```

## 🔒 Security Notes

- Never commit `.env` files
- Use strong JWT secrets in production
- Enable HTTPS in production
- Configure CORS properly for your domain
- Use environment variables for all sensitive data

## 📝 License

ISC

## 👨‍💻 Author

Your Name

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, email your-email@example.com or open an issue on GitHub.

