# VR Nuts E-Commerce Suite

A complete premium dry fruits and nutrient seeds e-commerce platform crafted for Tamil Nadu delivery from Kumbakonam Central Hub.

---

## 🏗️ Architecture Overview

The project is structured into three connected services:

| Component | Technology | Default Port | Description |
|---|---|---|---|
| **Customer Store (Frontend)** | React 19 + TypeScript + Vite | `http://localhost:5173` | Customer shopping storefront, weight selector (250g, 500g, 1kg), cart drawer, instant search, and live Tamil Nadu order tracking |
| **Backend API (Server)** | Node.js + Express (ES Modules) + Mongoose | `http://localhost:5001` | REST API for Products, Orders, Live Dispatch Milestones, Customer Auth, and Admin Analytics |
| **Admin Portal (Admin App)** | React 19 + Vite + Lucide Icons | `http://localhost:5174` | Administrator dashboard for inventory stock management, live dispatch tracking, sales metrics, and customer accounts |

---

## 🚀 Quick Start (Running All Services Together)

Run all three services simultaneously from the root directory:

```bash
npm run dev:all
```

Or run each service independently:

### 1. Customer Storefront
```bash
npm run dev
# Opens on http://localhost:5173
```

### 2. Backend API
```bash
npm run server
# Opens on http://localhost:5001
```

### 3. Admin Portal
```bash
npm run admin
# Opens on http://localhost:5174
```

---

## 🔑 Default Admin Credentials
- **Email:** `admin@vrnuts.com`
- **Password:** `admin123`

---

## 🗄️ Database Configuration (MongoDB / Mongoose)

- Configuration file: `server/.env`
- Default connection string:
  ```env
  PORT=5001
  MONGODB_URI=mongodb://127.0.0.1:27017/vr_nuts
  JWT_SECRET=vr_nuts_super_secret_jwt_key_2026_kumbakonam
  ```
- **Resilient Fallback Mode**: If local MongoDB is not yet running or if you are testing without MongoDB installed, the backend automatically runs in Local Persistent Mode (`server/data/local_db.json`), ensuring zero crashes and seamless local testing out-of-the-box!

---

## 📦 Core Backend API Endpoints

- `GET /api/health` - API and database health status
- `GET /api/products` - List products with category, search, and sort filters
- `POST /api/products` - Admin: Add new dry fruit/seed product
- `PUT /api/products/:id` - Admin: Edit pricing and stock
- `PATCH /api/products/:id/toggle-stock` - Admin: Toggle 250g, 500g, or 1kg variant stock
- `DELETE /api/products/:id` - Admin: Remove product from catalog
- `GET /api/orders` - List all customer orders
- `POST /api/orders` - Place checkout order with automated Tamil Nadu delivery milestones
- `PATCH /api/orders/:id/status` - Admin: Advance live delivery milestone (`confirmed` → `packed` → `in-transit` → `out-for-delivery` → `delivered`)
- `GET /api/admin/stats` - Revenue, total orders, active inventory, and Tamil Nadu district sales breakdown
- `POST /api/auth/login` - Authenticate customer or administrator
- `POST /api/auth/register` - Register customer account
