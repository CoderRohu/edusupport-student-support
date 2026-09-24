export type UserRole = 'student' | 'staff' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  studentId?: string; // e.g. STU-2024-042
  phone?: string;
  password?: string; // used internally on server
}

export type TicketCategory =
  | 'Fees'
  | 'Attendance'
  | 'ID Card'
  | 'Certificate'
  | 'Documents'
  | 'Examination'
  | 'Technical Support'
  | 'Hostel'
  | 'Transport'
  | 'Other';

export const TICKET_CATEGORIES: TicketCategory[] = [
  'Fees',
  'Attendance',
  'ID Card',
  'Certificate',
  'Documents',
  'Examination',
  'Technical Support',
  'Hostel',
  'Transport',
  'Other',
];

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export const TICKET_PRIORITIES: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];

export const SLA_HOURS_MAP: Record<TicketPriority, number> = {
  Critical: 4,
  High: 8,
  Medium: 24,
  Low: 48,
};

export type TicketStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Pending Student'
  | 'Pending Internal'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export const TICKET_STATUSES: TicketStatus[] = [
  'New',
  'Assigned',
  'In Progress',
  'Pending Student',
  'Pending Internal',
  'Resolved',
  'Closed',
  'Reopened',
];

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface InternalNote {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export type ActivityType =
  | 'created'
  | 'assigned'
  | 'reassigned'
  | 'priority_changed'
  | 'status_changed'
  | 'comment_added'
  | 'note_added'
  | 'escalated'
  | 'resolved'
  | 'reopened'
  | 'closed';

export interface Activity {
  id: string;
  ticketId: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  details: string;
  timestamp: string;
}

export interface Escalation {
  escalatedBy: string;
  escalatedByName: string;
  escalatedByRole: UserRole;
  escalatedAt: string;
  reason: string;
  currentOwnerId?: string;
  currentOwnerName?: string;
}

export interface Ticket {
  id: string; // e.g. TIK-1024
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffEmail?: string;
  createdAt: string;
  updatedAt: string;
  slaHours: number;
  slaDeadline: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  closedAt?: string;
  escalation?: Escalation;
  comments: Comment[];
  internalNotes?: InternalNote[]; // Excluded in student views
  activities: Activity[];
}

export type SLAState = 'on_track' | 'due_soon' | 'overdue' | 'resolved';

export interface SLACalculation {
  state: SLAState;
  label: string;
  badgeColor: string;
  remainingMs: number;
  remainingText: string;
  isBreached: boolean;
}

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  escalatedTickets: number;
  slaComplianceRate: number; // percentage 0-100
  avgResolutionTimeHours: number;
  criticalCount: number;
  highCount: number;
  unassignedCount: number;
  dueSoonCount: number;
  byCategory: { category: TicketCategory; count: number }[];
  byPriority: { priority: TicketPriority; count: number }[];
  byStatus: { status: TicketStatus; count: number }[];
  staffWorkload?: { staffId: string; staffName: string; activeCount: number; resolvedCount: number }[];
  ageingBreakdown?: {
    lessThan24h: number;
    oneToThreeDays: number;
    fourToSevenDays: number;
    moreThanSevenDays: number;
  };
}
