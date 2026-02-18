# 🚀 MyFreela – Freelance Management System

![Node](https://img.shields.io/badge/Node.js-22-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED)
![MySQL](https://img.shields.io/badge/MySQL-8-orange)
![License](https://img.shields.io/badge/license-MIT-black)

> Full-Stack application developed to solve a real financial control problem using modern architecture, clean separation of concerns and containerized environment.

---

# 📌 About the Project

**MyFreela** was created to replace manual spreadsheet control of freelance work with a structured and automated system.

The application centralizes:

- Worked hours tracking  
- Automatic revenue calculation  
- Tax control  
- Expense management  
- Monthly and annual financial reports  
- Real profit visualization  

This project was developed as a portfolio project with a strong focus on:

- Full-stack architecture
- API design
- Clean code organization
- JWT authentication
- Relational database modeling
- Docker containerization

---

# 🎯 Problem Solved

Before the system:

- Manual tracking in spreadsheets
- Manual tax calculations
- Difficult profit visualization
- Risk of inconsistencies
- No centralized metrics

After MyFreela:

- Automated gross/net calculation
- Structured hour tracking per client and task
- Recurring and one-time expense control
- Financial dashboard with metrics
- PDF report generation
- Reliable data structure

---

# 🏗 Architecture

The application follows a decoupled architecture:

React (SPA Frontend)
↓
Node.js (REST API Backend)
↓
MySQL (Relational Database)


## Key Architecture Decisions

- Backend isolated as REST API
- Frontend fully independent (SPA)
- Stateless authentication using JWT
- Containerized environment with Docker
- Clear separation of responsibilities

This structure allows:

- Independent scaling
- Easy deployment to VPS or cloud
- Future integration with mobile apps or SaaS multi-tenant model

---

# 🛠 Tech Stack

## 🔹 Backend

- Node.js 22 + Express
- TypeScript
- Prisma ORM
- MySQL 8
- JWT Authentication
- PDFKit (Report generation)
- Docker

## 🔹 Frontend

- React 19
- TypeScript
- Vite
- TailwindCSS
- React Router
- Axios
- Recharts
- React Hook Form + Zod
- date-fns

---

# 🔐 Security & Best Practices

- JWT-based authentication (stateless)
- Middleware-based route protection
- Centralized error handling
- Structured validation layer
- User data isolation
- Environment variable configuration
- Relational consistency (ACID compliance)

---

# 📊 Business Logic

Automated financial calculation:

grossAmount = totalHours × hourlyRate
taxAmount = grossAmount × (taxPercentage / 100)
netAmount = grossAmount − taxAmount


This eliminates manual calculation errors and provides reliable financial insights.

---

# 📦 Project Structure

The project follows a clear separation between backend, frontend and infrastructure layers.

myfreela/
│
├── backend/                 # REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Database and environment configuration
│   │   ├── controllers/     # Route handlers (business logic entry point)
│   │   ├── middleware/      # Authentication, validation, error handling
│   │   ├── routes/          # API route definitions
│   │   ├── types/           # TypeScript interfaces and types
│   │   ├── utils/           # Helper utilities (JWT, helpers)
│   │   └── server.ts        # Application entry point
│   ├── prisma/              # Database schema, migrations and seed
│   ├── Dockerfile           # Production container config
│   └── Dockerfile.dev       # Development container config
│
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Global state (Auth, Theme, etc.)
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API communication layer
│   │   ├── types/           # Type definitions
│   │   ├── App.tsx          # Routing & layout
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile
│   └── Dockerfile.dev
│
├── docker-compose.yml       # Production environment
└── docker-compose.dev.yml   # Development environment

---

# 🐳 Running with Docker

## 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/myfreela.git
cd myfreela

2️⃣ Configure environment variables
cp backend/.env.example backend/.env

3️⃣ Start containers
docker-compose -f docker-compose.dev.yml up --build

4️⃣ Run database migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

5️⃣ (Optional) Seed the database
docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed

🌐 Services
Service	URL
Frontend	http://localhost:3000

Backend API	http://localhost:4000/api

Health Check	http://localhost:4000/health
🔌 API Endpoints (Examples)
Method	Route	                            Description
POST	/api/auth/login	              User login
GET	/api/clients	                     List clients
POST	/api/tasks	                     Create task
GET	/api/dashboard	              Dashboard metrics
GET	/api/reports/monthly/:id/pdf	Generate PDF report

All routes (except authentication and health check) require:
Authorization: Bearer <token>


Features

User authentication

Client management

Task type management

Task tracking

Hour registration

Expense control (recurring and single)

Monthly financial closure

Dashboard with charts

PDF report generation

Light/Dark theme

Responsive UI

📈 What This Project Demonstrates

Ability to transform a real-world problem into a technical solution

Full-stack architecture design

REST API development

Relational database modeling

Docker containerization

Clean code organization

Financial logic implementation

Product-oriented thinking

🔮 Future Improvements

Multi-user / multi-tenant system

SaaS subscription model

Payment gateway integration

Cloud deployment with reverse proxy

CI/CD pipeline

Automated tests

🧑‍💻 Portfolio Purpose

This project was developed as a portfolio piece to demonstrate modern full-stack development skills and architectural decision-making.

📄 License

MIT