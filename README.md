# TCS-Style Coding Practice & Mock Test Platform

A full-stack, production-quality coding practice and assessment platform specifically designed for **TCS NQT / TCS-style coding assessment preparation**.

Unlike generic online IDEs, this platform strictly mirrors the real TCS NQT assessment software environment: **Strict Raw Editor Mode** (no autocomplete, no auto-closing brackets, no auto-quotes, no auto-indentation, no format-on-save), split-screen assessment UI, server-authoritative 90-minute timed mock tests, multi-language compilation judge (C++, Java, Python), 160+ TCS-style question bank, analytics & weakness detection engine, and admin question catalog management.

---

## Key Features & Highlights

- **Strict Raw Editor Mode (Default)**:
  - Disables autocomplete, IntelliSense, Copilot, snippet completions, auto-closing brackets `( [ {`, auto-closing quotes `' "`, auto-indentation on Enter, and format-on-save.
  - Requires candidates to type full syntax manually, building exact syntax memory needed for TCS NQT assessments.
- **Editor Modes**:
  - **Strict Mode** (Default assessment mode)
  - **Practice Mode** (Allows syntax highlighting & basic conveniences)
  - **Learning Mode** (Includes step-by-step logic explanations and reference solutions)
- **Multi-Language Judge**:
  - **C++**: `g++ -O2 -std=c++17`
  - **Java**: `javac` / `java` (OpenJDK 17)
  - **Python**: `python3`
- **160+ TCS Coding Question Bank**:
  - Spans 14 primary categories (Number Problems, Word Problems, Arrays, Strings, Hashing/Searching, Stack/Queue, Greedy/DP, Matrix, Recursion, Bit Manipulation, Patterns, Math, TCS Mixed Word Problems).
  - Assessment formatting: Problem Statement, Input/Output formats, Constraints, Sample Cases with Explanations, Public Tests, Hidden Tests, Edge Tests, and Stress Generators.
- **Server-Authoritative TCS Mock Assessment Engine**:
  - 90-minute 6-question timed test generator (balanced topic & difficulty selection: 2 Easy, 3 Medium, 1 Hard).
  - Server timer (`started_at`, `ends_at`) surviving refresh.
  - Question Navigator with status badges (`✓ Submitted`, `? Marked for Review`, `- Not Attempted`).
  - Automatic final submission on timer expiry and comprehensive result report card.
- **Analytics & Weakness Detection Engine**:
  - Tracks solved count, accuracy rate, average attempts, streak count, and per-topic proficiency percentages.
  - Automatically analyzes submission failures to detect weak topics (e.g., Dynamic Programming or Graphs) and suggests targeted practice problems.
- **Hidden Test Security**:
  - Hidden inputs and expected outputs are evaluated on the backend judge and never sent to the browser.
- **Admin Catalog Dashboard**:
  - Question creation/editing forms, test case management, and JSON bulk import/export.

---

## System Architecture

```
tcs-practice/
├── frontend/                  # React + TypeScript + Vite + Tailwind CSS + Monaco Editor
│   ├── src/
│   │   ├── components/        # StrictEditor, Console, ExamTimer, QuestionList, Navbar
│   │   ├── pages/             # Dashboard, QuestionBankPage, AssessmentScreen, MockTestPage, AnalyticsPage, AdminPage
│   │   ├── context/           # AuthContext
│   │   ├── services/          # Axios API Service
│   │   ├── utils/             # Editor strict raw configuration
│   │   └── types/             # TypeScript definitions
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── api/               # Auth, Questions, Submissions, Exams, Analytics, Admin routers
│   │   ├── core/              # Security, Database, Config
│   │   ├── judge/             # Code Execution & Test Runner Engine
│   │   ├── models/            # SQLAlchemy Database Models
│   │   └── schemas/           # Pydantic Request/Response Schemas
│   ├── seed/                  # 160+ TCS Questions Seeder Script
│   ├── requirements.txt
│   └── main.py
├── tests/                     # Unit, integration, raw editor & sandbox test suite
├── docker-compose.yml
└── README.md
```

---

## Local Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- C++ (`g++`), Java (`javac`), and Python 3 installed locally

### 1. Setup Backend & Seed Database
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install email-validator

# Seed database with 160+ TCS-style questions & default users
python seed/seed_db.py

# Start FastAPI backend server
python main.py
```
Backend API server will run at: `http://localhost:8000` (API Docs at `http://localhost:8000/api/v1/docs`).

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will run at: `http://localhost:3000`.

### 3. Run Automated Tests
```bash
./backend/venv/bin/pytest tests/
```

---

## Default User Accounts

- **Candidate User**: `candidate` / `candidate123`
- **Admin User**: `admin` / `admin123`
