# HubCommerce Pro - E-commerce Management Platform

A high-density, strategic business management platform built with React (Vite) and Node.js (Express).

## 🏗 Project Structure

- `client/`: React frontend powered by Vite, TailwindCSS (for base) and custom glassmorphic UI.
- `server/`: Express backend with Sequelize ORM and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (Optional, for caching)

### Installation

1. **Clone the repository**
2. **Setup Server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your DB and API keys
   npm run dev
   ```
3. **Setup Client**
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```

## 🛠 Tech Stack
- **Frontend**: React 18, Vite, Framer Motion, Zustand, Lucide React, MUI Charts.
- **Backend**: Node.js, Express, Sequelize, PostgreSQL.
- **AI**: Google Gemini 2.0 Integration.
- **Security**: JWT, OTP Verification, SuperAdmin Manual Validation.

## 📄 License
Privately owned by René.
