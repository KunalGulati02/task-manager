# Task Manager

A full-stack task management application where teams can create projects, assign tasks, and track progress.
Includes role-based access control (Admin/Member) and a dashboard for task insights and overdue tracking.

---

## Features

* **Authentication** — Signup/Login with JWT
* **Role-based access** — Admin and Member roles
* **Projects** — Create and manage projects, add/remove members
* **Tasks** — Create tasks, assign to members, track status
* **Dashboard** — View assigned tasks, overdue alerts, status counts

### Role Behavior

* **Admin** can create projects, manage members, and assign tasks
* **Member** can view assigned projects and update task status

---

## Tech Stack

* **Frontend** — React (Vite), React Router, Axios
* **Backend** — Node.js, Express
* **Database** — PostgreSQL
* **Auth** — JWT in HTTP-only cookies

---

## Project Structure

```
task-manager/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   └── middleware/
│       └── auth.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Projects.jsx
        │   └── ProjectDetail.jsx
        └── components/
            └── Header.jsx
```

---

## API Endpoints

| Method | Endpoint                          | Access |
| ------ | --------------------------------- | ------ |
| POST   | /api/auth/signup                  | Public |
| POST   | /api/auth/login                   | Public |
| POST   | /api/auth/logout                  | Public |
| GET    | /api/projects                     | Auth   |
| POST   | /api/projects                     | Admin  |
| GET    | /api/projects/:id                 | Auth   |
| DELETE | /api/projects/:id                 | Admin  |
| POST   | /api/projects/:id/members         | Admin  |
| DELETE | /api/projects/:id/members/:userId | Admin  |
| POST   | /api/tasks                        | Admin  |
| PUT    | /api/tasks/:id/status             | Auth   |
| DELETE | /api/tasks/:id                    | Admin  |
| GET    | /api/tasks/dashboard              | Auth   |
| GET    | /api/users                        | Admin  |

---

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done')),
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Local Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd task-manager

# Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/team-task
JWT_SECRET=your_long_random_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=5000
```

---

## Deployment

Deployed on Railway as a single service (Express serves React build in production).

---

## Demo Credentials

Admin:

* Email: [admin@test.com](mailto:admin@test.com)
* Password: password123

Member:

* Email: [user@test.com](mailto:user@test.com)
* Password: password123

---

## Live Demo

https://your-railway-url.up.railway.app
