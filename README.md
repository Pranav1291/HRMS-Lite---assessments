# HRMS Lite

A lightweight Human Resource Management System (HRMS) for managing employee records and tracking attendance.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide React (Icons), Motion (Animations)
- **Backend**: Node.js, Express
- **Database**: SQLite (via `better-sqlite3`)
- **Development**: Vite, tsx

## Features

- **Employee Management**:
  - Add new employees with unique IDs, names, emails, and departments.
  - View a list of all employees.
  - Delete employee records (cascades to attendance).
- **Attendance Management**:
  - Mark daily attendance (Present/Absent).
  - View attendance history for all employees.
- **Dashboard**:
  - Real-time stats for total employees and today's attendance.
  - Quick view of recent attendance records.
- **Validations**:
  - Server-side email format validation.
  - Unique Employee ID and Email constraints.
  - Required field checks.

## Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd hrms-lite
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Deployment Steps (Free)

To deploy this full-stack application for free, you can use **Render** or **Railway**.

### Option 1: Render (Recommended for Full-Stack)

1. **Push your code to GitHub**.
2. **Create a new Web Service** on [Render](https://render.com/).
3. **Connect your GitHub repository**.
4. **Configure the service**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   - Set `NODE_ENV` to `production`.
6. **Persistence**:
   - Since SQLite uses a local file (`hrms.db`), it will be wiped on every redeploy on Render's free tier unless you use a "Disk".
   - **Recommendation**: For a truly free persistent database, consider switching the database logic in `server.ts` to use a free MongoDB instance (MongoDB Atlas) or a free PostgreSQL instance (Neon.tech).

### Option 2: Vercel (Frontend) + Render (Backend)

1. **Deploy Backend to Render**: Follow the steps above but only serve the `/api` routes.
2. **Deploy Frontend to Vercel**:
   - Connect GitHub to [Vercel](https://vercel.com/).
   - Set the `VITE_API_URL` environment variable to your Render backend URL.
   - Update the frontend `fetch` calls to use this base URL.

## Assumptions & Limitations

- **Single Admin**: The system assumes a single admin user and does not implement authentication.
- **SQLite Persistence**: In serverless environments (like Vercel), the SQLite file will not persist between sessions. For production use, a hosted database like PostgreSQL or MongoDB is recommended.
- **Timezone**: Attendance dates are stored in ISO format (YYYY-MM-DD) based on the server's local time.
