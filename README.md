# ERP Management System

A full-stack Enterprise Resource Planning (ERP) system built with the MERN stack (MongoDB, Express.js, React, Node.js), featuring AI-powered business insights, a smart chatbot, and comprehensive business management modules.

## ⚠️ **Important: Security & Deployment Documents**

**Before deploying to production, read these documents:**

1. **[SECURITY_AND_DEPLOYMENT.md](./SECURITY_AND_DEPLOYMENT.md)** - Security features, compliance, and checklist
2. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
3. **[CREDENTIALS_AND_SECRETS.md](./CREDENTIALS_AND_SECRETS.md)** - Secrets management and best practices
4. **[HANDOFF_CHECKLIST.md](./HANDOFF_CHECKLIST.md)** - Complete application verification

⚠️ **Critical:** Change all default passwords immediately after first login. See **CREDENTIALS_AND_SECRETS.md** for details.

## Features

### Core Modules
- **Dashboard** — KPI cards, revenue charts, recent orders, and AI-generated business insights
- **Products** — Full CRUD, stock tracking, low stock alerts, CSV import/export
- **Customers** — Customer management with detail views and order history
- **Suppliers** — Supplier management with detail views and purchase history
- **Sales Orders** — Create orders with discount/tax calculations, status tracking
- **Purchase Orders** — Manage supplier orders and procurement workflow
- **Goods Receipt (GRN)** — Receive goods against purchase orders, update stock
- **Invoices** — Invoice generation, partial payments, PDF download
- **Quotations** — Create quotes with convert-to-sales-order workflow
- **Credit Notes** — Issue and track credit notes against invoices
- **Expenses** — Expense tracking with categories, approval workflow, and pie chart analytics

### AI-Powered Features
- **AI Chatbot** — Natural language queries about your business data (revenue, products, customers, invoices, etc.)
- **AI Business Insights** — Auto-generated insights on revenue trends, top products/customers, stock alerts, and overdue payments
- **Smart Reorder Suggestions** — Calculates optimal reorder quantities based on sales velocity and stock levels
- **Anomaly Detection** — Flags unusual orders, sales drops, stalled products, and high discounts

### Additional Features
- **User Management** — Role-based access control (Admin, Sales, Purchase, Inventory, Viewer)
- **Authentication** — JWT-based login/register with bcrypt password hashing
- **Dark Mode** — Toggle between light and dark themes
- **Activity Log** — Full audit trail of all user actions
- **Notifications** — Real-time notification bell with polling
- **Reports** — Sales, purchase, and inventory reports with charts
- **CSV Import/Export** — Bulk import products, customers, and suppliers
- **PDF Generation** — Download invoices as PDF
- **404 Page** — Custom error page with navigation

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Redux Toolkit | State management |
| Material UI 5 | Component library |
| React Router 6 | Client-side routing |
| Recharts | Data visualization |
| Axios | HTTP client |
| React Hook Form + Yup | Form handling & validation |
| jsPDF | PDF generation |
| dayjs | Date formatting |
| Vite | Build tool |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 4 | Web framework |
| Mongoose 7 | MongoDB ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Helmet | Security headers |
| Morgan | HTTP logging |
| express-validator | Request validation |

### Database
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (free tier) |

## Project Structure

```
ERP Management/
├── client/                     # React frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # Axios instance
│   │   ├── components/         # Reusable components
│   │   │   ├── AIChatbot.jsx
│   │   │   ├── AIInsights.jsx
│   │   │   ├── CSVImportDialog.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # 21 page components
│   │   ├── store/              # Redux store & slices
│   │   └── theme/              # MUI theme (light/dark)
│   └── vite.config.js
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # DB connection & env config
│   │   ├── controllers/        # 18 route controllers
│   │   ├── middleware/         # Auth, authorization, error handling
│   │   ├── models/            # 13 Mongoose models
│   │   ├── routes/            # 18 route files
│   │   ├── utils/             # ApiError, asyncHandler, logActivity
│   │   ├── index.js           # Server entry point
│   │   └── seed.js            # Admin user seeder
│   └── package.json
└── package.json               # Root scripts
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier) or local MongoDB

### 1. Clone the repository
```bash
git clone https://github.com/FarhanMohamed2005/ERP-Management.git
cd ERP-Management
```

### 2. Install dependencies
```bash
npm run install-all
```
This installs dependencies for both client and server.

### 3. Configure environment variables
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/erp_management?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Seed the admin user
```bash
cd server
npm run seed
```
This creates the default admin account:
- **Email:** admin@erp.com
- **Password:** Admin@123

### 5. Run the application
```bash
# From root directory - starts both frontend and backend
npm run dev
```
Or run them separately:
```bash
# Backend (port 5000)
cd server && npm run dev

# Frontend (port 5173)
cd client && npm run dev
```

### 6. Open in browser
Navigate to `http://localhost:5173` and log in with the admin credentials.

## API Endpoints

| Route | Description |
|---|---|
| `POST /api/auth/login` | User login |
| `POST /api/auth/register` | User registration |
| `GET /api/dashboard` | Dashboard statistics |
| `GET/POST /api/products` | Product management |
| `GET/POST /api/customers` | Customer management |
| `GET/POST /api/suppliers` | Supplier management |
| `GET/POST /api/sales-orders` | Sales order management |
| `GET/POST /api/purchase-orders` | Purchase order management |
| `GET/POST /api/grn` | Goods receipt notes |
| `GET/POST /api/invoices` | Invoice management |
| `GET/POST /api/payments` | Payment recording |
| `GET/POST /api/quotations` | Quotation management |
| `POST /api/quotations/:id/convert` | Convert quote to sales order |
| `GET/POST /api/credit-notes` | Credit note management |
| `GET/POST /api/expenses` | Expense tracking |
| `PUT /api/expenses/:id/approve` | Approve/reject expense |
| `GET /api/reports` | Report generation |
| `GET /api/activity-log` | Activity audit log |
| `GET /api/notifications` | User notifications |
| `GET /api/ai/insights` | AI business insights |
| `POST /api/ai/chat` | AI chatbot |
| `GET /api/ai/reorder-suggestions` | Smart reorder suggestions |
| `GET /api/ai/anomalies` | Anomaly detection |

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access to all modules |
| **Sales** | Dashboard, Products, Customers, Sales Orders, Quotations, Invoices, Credit Notes, Expenses, Reports |
| **Purchase** | Dashboard, Products, Suppliers, Purchase Orders, GRN, Expenses, Reports |
| **Inventory** | Dashboard, Products, Low Stock Alerts, GRN |
| **Viewer** | Dashboard, Products (read-only) |

## Screenshots

The application includes:
- Clean, modern UI with Material Design
- Responsive layout for desktop and mobile
- Dark mode support
- Interactive charts and data visualizations
- Floating AI chatbot widget

## License

This project is for educational and demonstration purposes.
