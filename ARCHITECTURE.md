# System Architecture: EduSupport Platform

> **Edumerge Solutions Pre-Drive Product Engineering Assignment**  
> **Option 4 — Student Support & Ticket Management**

---

## 1. System Architecture Overview

EduSupport utilizes a full-stack, single-process web application architecture. The Node.js Express server mounts Vite’s SPA middleware in development and serves pre-compiled static assets in production, exposing a REST API on `/api/*`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Browser (React 19)                       │
│                                                                        │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│   │ Student Viewport │  │  Staff Viewport  │  │  Manager Viewport  │   │
│   └────────┬─────────┘  └────────┬─────────┘  └────────┬───────────┘   │
│            └─────────────────────┼─────────────────────┘               │
│                                  │ Bearer Token HTTP API Calls         │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express Server (Port 3000)               │
│                                                                        │
│   ┌──────────────────────┐           ┌─────────────────────────────┐   │
│   │ Authentication Guard │           │ REST API Endpoints          │   │
│   │ (Token Verification) │ ────────> │ /api/auth/*                 │   │
│   └──────────────────────┘           │ /api/tickets/*              │   │
│                                      │ /api/dashboard/stats        │   │
│                                      │ /api/users                  │   │
│                                      └──────────────┬──────────────┘   │
│                                                     ▼                  │
│                                      ┌─────────────────────────────┐   │
│                                      │ Data Store Engine           │   │
│                                      │ (Role Isolation & Security) │   │
│                                      └──────────────┬──────────────┘   │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      ▼
                                       ┌─────────────────────────────┐
                                       │ Persistent Datastore (JSON) │
                                       │ server/data/db.json         │
                                       └─────────────────────────────┘
```

---

## 2. Frontend Architecture

The frontend is constructed using **React 19**, **TypeScript**, **Tailwind CSS v4**, and **React Router v7**.

### Component Hierarchy & Layout
* **App Router (`src/App.tsx`):** Root provider combining `ToastProvider`, `AuthProvider`, and route definitions.
* **Layout Shell (`src/components/layout/Layout.tsx`):**
  * **Sidebar:** Dynamic navigation reflecting the user's role (`student`, `staff`, `manager`), queue shortcuts, documentation link, fast role switcher, and database reset action.
  * **TopBar:** 3-zone header compliant with frontend design standards (Breadcrumbs left, active SLA policy status center, user profile & action right).
  * **Protected Route Guard (`src/components/ProtectedRoute.tsx`):** Enforces active sessions and role-specific permissions before rendering viewports.
* **Dashboards:**
  * `StudentDashboard.tsx`: Metric cards, quick "Raise Ticket" CTA, and active requests table.
  * `StaffDashboard.tsx`: Actionable triage bar (My Active, Unassigned, Due Soon, Overdue, Critical, High) and live activity stream.
  * `ManagerDashboard.tsx`: Executive KPIs, escalated tickets spotlight, staff workload allocation table, and ticket ageing distribution.
* **Ticket Management Console (`src/pages/TicketsPage.tsx`):** Filterable, searchable, and sortable table with URL-synchronized parameters.
* **Ticket Investigation Page (`src/pages/TicketDetailsPage.tsx`):** Complete incident view with action modals (Assign, Priority, Status, Escalate, Reopen), two-tab discussion section (Public Comments vs. Confidential Internal Notes), and chronological audit timeline.

---

## 3. Database Architecture & Schema Models

The datastore engine (`server/data/store.ts`) manages normalized, relational-style collections in memory with atomic disk persistence:

### 1. User Model
```typescript
interface User {
  id: string;               // e.g. "usr-student-1"
  name: string;             // e.g. "Aarav Sharma"
  email: string;            // e.g. "student@edusupport.demo"
  role: 'student' | 'staff' | 'manager';
  department?: string;      // e.g. "Computer Science & Engineering"
  studentId?: string;       // e.g. "STU-2024-001"
  phone?: string;
  password?: string;        // Omitted in API serialization
}
```

### 2. Ticket Model
```typescript
interface Ticket {
  id: string;               // e.g. "TIK-2026-101"
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment?: string;
  category: TicketCategory; // Fees, Attendance, ID Card, Certificate, Documents, etc.
  subject: string;
  description: string;
  priority: TicketPriority; // Critical, High, Medium, Low
  status: TicketStatus;     // New, Assigned, In Progress, Pending Student/Internal, Resolved, Closed, Reopened
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffEmail?: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  slaHours: number;         // 4, 8, 24, 48
  slaDeadline: string;      // ISO 8601
  resolvedAt?: string;
  resolutionNotes?: string;
  closedAt?: string;
  escalation?: Escalation;
  comments: Comment[];
  internalNotes?: InternalNote[]; // Stripped for students
  activities: Activity[];
}
```

### 3. Comment & Internal Note Models
```typescript
interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

interface InternalNote {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}
```

### 4. Activity & Escalation Models
```typescript
interface Activity {
  id: string;
  ticketId: string;
  type: ActivityType;       // created, assigned, reassigned, priority_changed, status_changed, etc.
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  details: string;
  timestamp: string;
}

interface Escalation {
  escalatedBy: string;
  escalatedByName: string;
  escalatedByRole: UserRole;
  escalatedAt: string;
  reason: string;
  currentOwnerId?: string;
  currentOwnerName?: string;
}
```

---

## 4. Authentication & Authorization Workflow

1. **Authentication Flow:**
   * Client posts credentials to `/api/auth/login`.
   * Server validates email/password and generates a cryptographically random session token stored in `store.sessions[token]`.
   * Client persists token in `localStorage` under `edusupport_auth_token` and automatically injects it as an `Authorization: Bearer <token>` header on subsequent requests.
2. **Authorization & Security Isolation:**
   * `requireAuth` middleware validates the Bearer token and attaches `req.user`.
   * **Student Isolation Rule:** When `req.user.role === 'student'`, the server enforces:
     ```typescript
     if (user.role === 'student') {
       tickets = tickets.filter(t => t.studentId === user.id);
       // Strip internal notes from responses
       return tickets.map(({ internalNotes, ...t }) => t);
     }
     ```
   * **Individual Ticket Isolation:** In `GET /api/tickets/:id`, if `user.role === 'student'` and `ticket.studentId !== user.id`, the server responds with `403 Forbidden`.
   * **Internal Notes Protection:** The route `POST /api/tickets/:id/notes` explicitly verifies `req.user.role !== 'student'`. Any student attempt to post or retrieve internal notes results in `403 Forbidden`.

---

## 5. End-to-End Data Flow

```
1. Student fills ticket form (Category, Subject, Description, Priority)
   │
   ▼
2. Client sends POST /api/tickets
   │
   ▼
3. Server validates fields, computes SLA deadline (now + slaHours), 
   creates 'created' Activity, saves to disk, returns ticket record
   │
   ▼
4. Ticket lands in 'Unassigned Queue' (visible to staff & manager)
   │
   ▼
5. Staff agent clicks 'Claim Ticket' (PATCH /api/tickets/:id/assign)
   │ Status changes from 'New' -> 'Assigned', logs 'assigned' Activity
   ▼
6. Staff investigates, logs confidential internal note (POST /api/tickets/:id/notes),
   and updates status to 'In Progress' (PATCH /api/tickets/:id/status)
   │
   ▼
7. Staff resolves ticket with mandatory resolution notes (PATCH /api/tickets/:id/status)
   │ Sets resolvedAt, verifies SLA compliance (met vs breached), logs 'resolved' Activity
   ▼
8. Student receives resolution notice. If unsatisfied, student clicks 'Reopen Ticket'
   │ Status transitions to 'Reopened', ticket returns to active staff queue
```
