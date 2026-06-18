# Phishing Review & Labeling Tool

A local full-stack web application for importing, reviewing, labeling, and exporting potentially malicious URLs and emails.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TypeScript, Pure CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** SQLite (`better-sqlite3`)
- **Testing:** Vitest

## 🚀 Quick Start

### 1. Install Dependencies

You need to install dependencies for both the frontend and backend.

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Start the Development Servers

#### Option A: Using Docker (Recommended)
You can start both the frontend and backend simultaneously using Docker Compose:
```bash
docker-compose up --build
```
*The Web UI will be available at `http://localhost:5173` and the API at `http://localhost:3001`.*

#### Option B: Running Locally (Node.js)
You will need two terminal windows to run both servers concurrently.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*The Web UI runs on `http://localhost:5173`. Open this URL in your browser.*

## 🧪 Testing & Linting

Both the `client` and `server` directories have comprehensive test suites and linters configured. 

```bash
# Run backend tests & coverage
cd server
npm run test
npm run coverage

# Run frontend tests & coverage
cd client
npm run test
npm run coverage
```

To check for code style and type errors, you can run the following inside either `client` or `server`:
```bash
npm run lint      # Runs ESLint
npm run typecheck # Runs TypeScript compiler checks
```

## 📂 Project Structure
- `/server` — Express REST API and SQLite database layer. 
- `/client` — React UI.
