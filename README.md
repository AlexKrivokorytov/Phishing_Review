# Phishing Review & Labeling Tool

A professional full-stack web application built as an internship project for importing, reviewing, labeling, and exporting potentially malicious URLs and emails. The project demonstrates a deep understanding of Object-Oriented Programming (OOP), software design patterns, and strict typing.

## ✨ Key Features
- **100% Offline & Secure:** Runs entirely on the local machine without cloud dependencies or authentication requirements.
- **Dynamic Search & Filtering:** Instantly filter records by status (new, reviewed) or search by URL/email using real-time inputs.
- **Review Workflow:** Update record statuses, assign threat labels (`benign`, `suspicious`, `phishing`, `malware`), and add detailed analyst notes.
- **Evidence Tagging:** Assign multiple descriptive tags (e.g., `credential_form`, `brand_impersonation`) to records.
- **Import/Export Pipeline:** Robust support for importing and exporting data in both **CSV** and **JSON** formats.
- **Responsive UI/UX:** A beautifully crafted, symmetric, and adaptive user interface tailored for all screen sizes, built entirely with pure CSS.

## 🏛️ Architecture & Design Patterns
This project strictly adheres to clean code guidelines, SOLID principles, and Gang of Four (GoF) design patterns:
- **Repository Pattern:** Completely abstracts raw SQL queries from business logic (`RecordRepository`, `TagRepository`).
- **Strategy Pattern (GoF):** Encapsulates different parsing and serializing algorithms for files. `ImportService` and `ExportService` rely on `IImportStrategy` and `IExportStrategy` (with specific CSV/JSON implementations) to adhere to the Open/Closed Principle.
- **Factory Method & Singleton (GoF):** `DatabaseFactory` controls the instantiation and lifecycle of the SQLite connection, ensuring a single, globally accessible memory-safe instance.
- **Dependency Injection (DI):** A custom IoC container wires up Repositories, Services, and Controllers to ensure high testability and loose coupling.
- **Facade:** Services act as facades to coordinate complex multi-repository transactions.
- **Centralized Error Handling:** Express middleware cleanly catches and formats all API errors without leaking raw SQL traces to the client.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TypeScript, Pure CSS (Mobile-First, Adaptive)
- **Backend:** Node.js (v20+), Express.js, TypeScript
- **Database:** SQLite via `better-sqlite3` (Synchronous, Strict 3NF Relational Model)
- **Testing:** Vitest

## ⚙️ Quick Start

### 1. Install Dependencies
Run the following command in both the `client` and `server` directories:
```bash
npm install
```

### 2. Start the Backend
From the `server` directory, start the development server (runs on `http://localhost:3001`):
```bash
npm run dev
```

### 3. Start the Frontend
From the `client` directory, start the Vite server (runs on `http://localhost:5173`):
```bash
npm run dev
```

## 📡 Core API Endpoints

- **`GET /api/records`** — Fetch records (supports `?status=` and `?search=` filters).
- **`GET /api/records/counts`** — Get dashboard statistics.
- **`PATCH /api/records/:id`** — Update a record's label, status, notes, or tags.
- **`GET /api/tags`** — Fetch all available dynamic tags.
- **`POST /api/import/file`** — Import records via CSV or JSON upload (`multipart/form-data`).
- **`GET /api/export/csv`** & **`/api/export/json`** — Download records in the specified format.

## 🧪 Testing & Code Quality
The backend features an exhaustive unit testing suite written in **Vitest**, ensuring 100% coverage of repositories and services using an isolated in-memory database setup.
Run tests via:
```bash
npm run test
```
Linting and strict type checking are enforced via `eslint` and `tsc`.
