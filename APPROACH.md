# Engineering & Product Approach: EduSupport Platform

> **Edumerge Solutions Pre-Drive Product Engineering Assignment**  
> **Option 4 — Student Support & Ticket Management**

---

## 1. Problem Understanding & Context

Higher education institutions face high volumes of heterogeneous student inquiries spanning tuition fees, examination scheduling conflicts, hostel maintenance, document verifications, and IT infrastructure. Traditional communication channels (untracked emails, paper grievance slips, WhatsApp groups) suffer from critical failure modes:
1. **Lack of Ownership:** Tickets remain unassigned or languish in departmental silos.
2. **Absence of SLA Accountability:** Urgent issues (such as tuition debit duplications or exam slot clashes) are buried under routine requests.
3. **Data Privacy & Compliance Violations:** Students accidentally receiving insight into peers' academic records or staff internal discussions.
4. **Zero Administrative Observability:** Management lacks quantifiable visibility into staff workload distribution, resolution times, and recurring infrastructural bottlenecks.

**EduSupport** addresses these pain points by establishing an authoritative, multi-tenant ticket lifecycle platform engineered with strict role-based isolation, dynamic SLA tracking, confidential internal staff collaboration, and real-time operational analytics.

---

## 2. Product Assumptions & Specifications

1. **Academic Calendar & Departmental Alignment:**
   Tickets fall into 10 structured institutional categories:
   * *Fees* (tuition double debits, scholarship concessions, loan disbursements)
   * *Attendance* (medical leaves, on-duty duty waivers, biometric scanner errors)
   * *ID Card* (lost smart cards, RFID chip encoding, barcode printing errors)
   * *Certificate* (bonafide certificates, Medium of Instruction letters, rank certificates)
   * *Documents* (transcripts, WES attestation, archival 12th migration forms)
   * *Examination* (hall ticket locks, timetable clashes, re-evaluation mark discrepancies)
   * *Technical Support* (campus Wi-Fi, LMS authentication, compute cluster SSH keys)
   * *Hostel* (electrical maintenance, room furniture repairs, RO water quality)
   * *Transport* (bus delay mitigations, night studio security shuttles)
   * *Other* (campus club permissions, accessibility ramps)

2. **SLA Assumptions & Calculation Matrix:**
   * **Critical (4 Hours):** Severe disruptions impacting financial transactions, physical student safety, or immediate exam/assignment portal lockouts.
   * **High (8 Hours):** Time-sensitive academic issues (exam schedule clashes, hall ticket blocks, attendance medical waivers).
   * **Medium (24 Hours):** Standard operational processing (ID card RFID encoding, scholarship verification, bonafide certificates).
   * **Low (48 Hours):** Routine administrative requests, spelling corrections, transcript attestations.
   * *Dynamic Calculation:* SLA deadlines are computed at `ticket.createdAt + slaHours`. Visual indicators change dynamically between 🟢 On Track, 🟡 Due Soon (&le; 2h or &le; 25% window), 🔴 Overdue (calculating exact elapsed breach duration), and ✓ Resolved. Changing a ticket's priority dynamically recalculates its SLA deadline if unresolved.

---

## 3. User Roles & Access Control Model

| Role | Target Persona | Primary Responsibilities & Constraints |
| :--- | :--- | :--- |
| **Student** | Enrolled undergraduate or graduate student | Can raise tickets, search/filter only their own tickets, post public comments, review status/SLA, and reopen resolved requests. **Strictly barred from viewing other students' tickets, internal notes, staff dashboards, or manager consoles.** |
| **Support Staff** | Departmental support officers (Accounts, Exam Cell, IT, Hostel) | Can review assigned and unassigned queues, claim tickets, reassign tickets, adjust status and priority, post public responses, add confidential internal notes, resolve tickets (with mandatory resolution notes), and escalate. |
| **Manager / Admin** | Director of Student Experience, Dean of Student Affairs | Global visibility across all tickets, students, and staff; reviews SLA breaches, ticket ageing distributions, agent workload capacity, and handles escalated cases. |

---

## 4. Ticket Status Workflow State Machine

The ticket follows an audited, linear progression with a verified reopening loop:

```
┌───────┐      ┌──────────┐      ┌─────────────┐      ┌─────────────────┐      ┌──────────┐      ┌────────┐
│  New  │ ───> │ Assigned │ ───> │ In Progress │ ───> │ Pending Student │ ───> │ Resolved │ ───> │ Closed │
└───────┘      └──────────┘      └─────────────┘      │   or Internal   │      └──────────┘      └────────┘
                                        ▲             └─────────────────┘           │
                                        │                                           │
                                        └─────────── [ Reopened ] <─────────────────┘
```

* **Mandatory Resolution Rationale:** Staff cannot mark a ticket as `Resolved` without recording concrete `resolutionNotes` explaining the corrective action.
* **Student Reopen Privilege:** If a resolution is incomplete or flawed, the student can transition the ticket to `Reopened`, generating an automatic timeline entry and moving the ticket back to the active queue.

---

## 5. Design Decisions & Architectural Discipline

1. **Unified Full-Stack Express & Vite Runtime:**
   Rather than running disjointed frontend and backend services requiring separate terminals and complex environment variable synchronization, the server embeds Express with Vite middleware in development mode (`tsx server.ts`). Both the frontend and backend run synchronously on port 3000, ensuring immediate evaluator accessibility.
2. **Server-Enforced Data Isolation:**
   Security rules are enforced on the backend data layer, not just hidden in UI views:
   * Querying `/api/tickets` as a student filters records at the database level by `ticket.studentId === req.user.id`.
   * Accessing a specific ticket (`/api/tickets/:id`) checks ownership and returns `403 Forbidden` if unauthorized.
   * `internalNotes` are stripped from JSON payloads before sending responses to students.
3. **Linear / Stripe Inspired Visual Language:**
   * Strictly enforces the **Anti-Slop Constitution**: zero garish purple gradients, zero fake AI telemetry scores, zero card-in-card nesting, and single-level elevation.
   * Typography pairs `Plus Jakarta Sans` for titles and prose with `JetBrains Mono` for tabular numerals (`tabular-nums`) to ensure vertical numeric alignment.

---

## 6. Trade-offs & Considered Alternatives

* **File-Backed JSON Datastore vs. Cloud PostgreSQL / External DB:**
  * *Decision:* Implemented a structured, transactionally written JSON store (`server/data/store.ts`) synchronized to disk with automatic seed bootstrapping.
  * *Trade-off:* Avoids database connection pool timeouts, cold starts, and complex external cloud credentials, while guaranteeing 100% demo reliability across page refreshes and server reboots.
* **Client-Side vs. Server-Side SLA Recalculation:**
  * *Decision:* SLA deadline timestamps are established at creation and priority mutation on the server; dynamic human countdowns and overdue breach labels are calculated dynamically by a shared utility (`src/utils/sla.ts`).

---

## 7. Handled Edge Cases

1. **Reopening Closed Tickets:** Only tickets with status `Resolved` can be reopened by students. Tickets marked permanently `Closed` cannot be reopened.
2. **Empty Submissions & Malformed Payloads:** Strict validation on all required fields (category, subject &ge; 5 chars, description &ge; 15 chars, resolution notes on closure, escalation reason on escalation).
3. **Session Expiry & Token Tampering:** If a token is invalid or expired, the API client clears the token and redirects to `/login` without looping.
4. **Duplicate Submission Prevention:** Submit buttons are disabled and display loading spinners during in-flight network requests.
5. **Overdue Duration Tracking:** When an SLA deadline is breached, the badge displays exact elapsed overdue time (e.g., `10h overdue`) rather than a generic error.
