# Charaka Trading — Vehicle Lifecycle & Transaction Management System

A full-stack web application for managing vehicle inventory, sales transactions, and business analytics for a vehicle trading business.

---

## 🧰 Tech Stack

| Layer      | Technologies                                                                 |
|------------|------------------------------------------------------------------------------|
| **Frontend** | React 19, Vite, Tailwind CSS, shadcn/ui, React Router v7, TanStack Query, Recharts, React Hook Form, Zod |
| **Backend**  | Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, Multer, bcryptjs |
| **Database** | MongoDB                                                                      |
| **Auth**     | JSON Web Tokens (JWT) + bcryptjs password hashing                           |

> **Stack summary:** MERN (MongoDB · Express · React · Node.js)

---

## 📋 Project Overview

**Charaka Trading** is a business management platform built for a vehicle dealership. It tracks the complete lifecycle of a vehicle — from purchase/listing through to sale — and provides tools for managing users, roles, transactions, and business analytics.

---

## ✨ Key Features

### 🚗 Vehicle Management
- Add, edit, and remove vehicle listings (cars, motorbikes, three-wheelers)
- Track vehicle status: `available`, `sold`, `archived`, `relisted`
- Store detailed specs: brand, model, year, colour, mileage, engine capacity, fuel type, transmission, body type
- Upload and manage multiple vehicle images
- Flexible pricing: purchase cost, profit margin (percentage or fixed), discounts
- Re-list previously sold vehicles with full history tracking

### 💳 Transaction Management
- Record **purchase** and **sale** transactions
- Vehicle snapshot stored at time of transaction to preserve historical accuracy
- Support for multiple payment methods: cash, bank transfer, cheque, finance, mixed
- Track payment status: pending, partial, completed
- Finance/leasing details (down payment, leasing value, finance company)
- Auto-generated unique transaction numbers (`TXN-<timestamp>-<count>`)

### 📊 Analytics & Dashboard
- Business KPI dashboard (revenue, profit, vehicle counts)
- Sales analytics with charts (powered by Recharts)
- Summary statistics via a dedicated `/api/stats` endpoint

### 👥 User & Permission Management
- User registration and login with JWT-based authentication
- Role-based access control (admin vs. staff)
- Granular permissions management per user
- Admin panel for managing all users

### 🏪 Store Settings
- Configurable store information (name, address, contact details)
- Managed through a dedicated admin settings page

---

## 🗂️ Project Structure

```
Charaka-Trading/
├── backend/                     # Node.js / Express API
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── constants/               # Shared constants
│   ├── controllers/             # Route handler logic
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── transactionController.js
│   │   ├── statsController.js
│   │   ├── storeController.js
│   │   └── permissionController.js
│   ├── middleware/              # Auth & validation middleware
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Transaction.js
│   │   ├── StoreInfo.js
│   │   └── RolePermission.js
│   ├── routes/                  # Express route definitions
│   ├── utils/                   # Helper utilities
│   └── server.js                # App entry point
│
└── frontend/                    # React / Vite SPA
    └── src/
        ├── api/                 # Axios API client functions
        ├── components/
        │   ├── layout/          # App shell (sidebar, navbar)
        │   └── ui/              # Reusable shadcn/ui components
        ├── context/             # React context (auth, theme)
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Vehicles.jsx
        │   ├── VehicleDetails.jsx
        │   ├── Profile.jsx
        │   ├── Settings.jsx
        │   └── admin/
        │       ├── Dashboard.jsx
        │       ├── Analytics.jsx
        │       ├── AdminVehicles.jsx
        │       ├── AddVehicle.jsx
        │       ├── EditVehicle.jsx
        │       ├── AdminVehicleDetails.jsx
        │       ├── Transactions.jsx
        │       ├── AddTransaction.jsx
        │       ├── TransactionDetails.jsx
        │       ├── Users.jsx
        │       ├── Permissions.jsx
        │       └── StoreSettings.jsx
        ├── lib/                 # Utility helpers (e.g. cn)
        └── utils/               # Shared utility functions
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB instance (local or Atlas)

### Backend
```bash
cd backend
npm install
# Create a .env file with MONGO_URI, JWT_SECRET, PORT, NODE_ENV
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The API runs on **http://localhost:5000** and the frontend dev server on **http://localhost:5173** by default.

---

## 📡 API Endpoints

| Prefix                          | Methods                  | Description              |
|---------------------------------|--------------------------|--------------------------|
| `/api/auth`                     | POST                     | Register / Login         |
| `/api/vehicles`                 | GET, POST, PUT, DELETE   | Vehicle CRUD             |
| `/api/transactions`             | GET, POST, PUT, DELETE   | Transaction CRUD         |
| `/api/stats`                    | GET                      | Business statistics      |
| `/api/store`                    | GET, PUT                 | Store info management    |
| `/api/permissions`              | GET, PUT                 | Role permissions         |
