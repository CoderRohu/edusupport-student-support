# EduSupport — Student Support & Ticket Management Platform

> **Edumerge Solutions Pre-Drive Product Engineering Assignment**  
> **Option 4 — Student Support & Ticket Management Platform**

EduSupport is a production-grade, full-stack college and university support-ticket management platform. It enables students to raise academic, financial, administrative, and infrastructural inquiries while empowering support staff and campus administrators to claim, prioritize, process, investigate, resolve, and audit requests under strict SLA targets.

---

## 🚀 Live Demo & Accounts

The platform includes 1-click login presets on the sign-in page for immediate evaluation testing:

| Role | Email | Password | Representative User | Primary Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student@edusupport.demo` | `Password123!` | Aarav Sharma (CSE Dept) | Raise tickets, view only own tickets, public comments, reopen resolved tickets |
| **Support Staff** | `staff@edusupport.demo` | `Password123!` | Priya Iyer (Registrar Desk) | Claim tickets, reassign, change status, change priority, confidential internal notes, resolve, escalate |
| **Manager / Admin** | `manager@edusupport.demo` | `Password123!` | Dr. Vikram Malhotra (Student Experience) | View all tickets, staff workload, SLA breaches, ticket ageing, escalations, staff directory |

*Additional accounts:* 10 pre-registered students (`STU-2024-001` through `STU-2024-145`), 5 department support officers (Accounts, Examination, IT, Hostel & Logistics, Registrar), and 32 pre-seeded tickets spanning all categories, priorities, and workflow statuses.

---

## 🛠 Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, React Router v7.
* **Backend & API:** Node.js / Express with TypeScript (`tsx`), REST API with Bearer session authentication.
* **Data Storage:** Structured, transactional JSON datastore (`server/data/store.ts`) with persistent disk sync, automatic seed bootstrapping, and real-time SLA calculation.
* **Design Philosophy:** Clean SaaS typography (`Plus Jakarta Sans`, `JetBrains Mono` tabular figures), 3-zone top bar, zero-pill metadata discipline, and role-tailored dashboards.

---

## ✨ Core Features Implemented

### 1. Student Portal
* **Raise Tickets:** Polished form with categories, rich descriptions, and priority selection with real-time SLA guarantee previews.
* **Strict Student Data Isolation:** Students can **never** view or query other students' tickets. Accessing another student's ticket ID returns a strict `403 Forbidden`.
* **Public Discussion:** Two-way message exchange between student and support officers.
* **Resolution Verification & Reopening:** Students can reopen resolved tickets if the problem persists, automatically pushing the ticket back into active staff triage.

### 2. Support Staff Console
* **Triage & Ownership:** View unassigned queue, claim tickets with one click, or reassign to specialized department colleagues.
* **Confidential Internal Notes:** Staff can document sensitive investigation details, system lookups, and handover notes. **Internal notes are strictly filtered and never sent to students in UI or API responses.**
* **Lifecycle Management:** Progress tickets through `New` → `Assigned` → `In Progress` → `Pending Student / Pending Internal` → `Resolved` → `Closed`.
* **Mandatory Resolution Notes:** Enforces documented explanations before marking tickets as Resolved.
* **Escalations:** Escalate high-risk or policy-blocking cases directly to the Manager's emergency queue.

### 3. Manager & Executive Analytics
* **Real-time KPI Dashboard:** Workload metrics, active queues, overdue breach counts, SLA compliance percentage, and average resolution time calculated from real ticket timestamps.
* **Staff Workload Allocation:** Live monitoring of active cases and resolved counts across all 5 support agents with capacity utilization indicators.
* **Ticket Ageing Matrix:** Categorizes unclosed requests into `< 24h`, `1–3 Days`, `4–7 Days`, and `> 7 Days` (high risk).
* **Escalated Ticket View:** Dedicated spotlight for critical safety, policy, and legal escalations.

### 4. Dynamic SLA Engine
* **Critical:** 4-hour resolution target.
* **High:** 8-hour resolution target.
* **Medium:** 24-hour resolution target.
* **Low:** 48-hour resolution target.
* **Visual States:** 🟢 On Track, 🟡 Due Soon (remaining &le; 2h or &le; 25%), 🔴 Overdue (displays elapsed overdue duration), ✓ Resolved (with SLA compliance status).

---

## 📂 Project Structure

```
├── server.ts                    # Full-stack Express server with Vite middleware integration
├── server/
│   └── data/
│       ├── seed.ts              # 16 demo users (10 students, 5 staff, 1 manager) & 32 tickets
│       ├── store.ts             # Server datastore, session manager, and role-enforced business logic
│       └── db.json              # Persistent datastore file
├── src/
│   ├── main.tsx                 # React app entry point
│   ├── App.tsx                  # App routes and providers
│   ├── index.css                # Tailwind CSS v4 styling & typography
│   ├── api/
│   │   └── client.ts            # Typed REST API client with Bearer token authentication
│   ├── context/
│   │   ├── AuthContext.tsx      # User authentication, session, and 1-click role switcher
│   │   └── ToastContext.tsx     # Toast notification feedback system
│   ├── types/
│   │   └── index.ts             # TypeScript definitions for Users, Tickets, SLA, and Metrics
│   ├── utils/
│   │   └── sla.ts               # Dynamic SLA calculation and ageing algorithms
│   ├── components/
│   │   ├── layout/              # Sidebar, TopBar, and responsive Layout wrapper
│   │   ├── StatusBadge.tsx      # Semantic ticket status badges
│   │   ├── PriorityBadge.tsx    # Priority level badges
│   │   ├── SLABadge.tsx         # Dynamic SLA countdown & breach badges
│   │   ├── CategoryBadge.tsx    # Clean category indicators
│   │   └── ProtectedRoute.tsx   # Route authorization & role guard
│   └── pages/
│       ├── LoginPage.tsx        # Sign-in page with 1-click demo accounts
│       ├── DashboardPage.tsx    # Role-dispatched dashboard switcher
│       ├── dashboards/
│       │   ├── StudentDashboard.tsx
│       │   ├── StaffDashboard.tsx
│       │   └── ManagerDashboard.tsx
│       ├── TicketsPage.tsx      # Comprehensive ticket table with search, filters & pagination
│       ├── CreateTicketPage.tsx # Polished ticket submission form
│       ├── TicketDetailsPage.tsx# Ticket detail view, discussion, internal notes & audit trail
│       ├── StaffDirectoryPage.tsx # Staff & student directory
│       └── DocumentationPage.tsx# In-app technical specifications viewer
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── APPROACH.md
├── ARCHITECTURE.md
└── AI_USAGE_REPORT.md
```

---

## 🏃 Setup & Execution

### 1. Installation
```bash
npm install
```

### 2. Development Mode
Run the unified full-stack server (serves the Express API and Vite frontend on port 3000):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

### 4. Resetting Demo Data
At any point during testing, click **"Reset Demo Data"** at the bottom of the sidebar (or call `POST /api/reset-demo`) to restore the database to its pristine state with 32 seed tickets and 16 accounts.
