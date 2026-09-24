import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Ticket, TicketPriority, TicketStatus, SLA_HOURS_MAP } from '../../src/types';
import { SEED_USERS, generateSeedTickets } from './seed';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');

export interface DatabaseState {
  users: User[];
  tickets: Ticket[];
  sessions: Record<string, string>; // token -> userId
}

class Store {
  private state: DatabaseState = {
    users: [],
    tickets: [],
    sessions: {},
  };

  constructor() {
    this.init();
  }

  public init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        // Ensure sessions object exists
        if (!this.state.sessions) {
          this.state.sessions = {};
        }
      } else {
        this.resetToSeed();
      }
    } catch {
      this.resetToSeed();
    }
  }

  public resetToSeed() {
    this.state = {
      users: [...SEED_USERS],
      tickets: generateSeedTickets(),
      sessions: {},
    };
    this.save();
  }

  private save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Session & Auth
  public createSession(userId: string): string {
    const token = `tok_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    this.state.sessions[token] = userId;
    this.save();
    return token;
  }

  public getUserByToken(token: string): User | null {
    const userId = this.state.sessions[token];
    if (!userId) return null;
    return this.getUserById(userId);
  }

  public removeSession(token: string) {
    delete this.state.sessions[token];
    this.save();
  }

  public getUserById(id: string): User | null {
    const user = this.state.users.find((u) => u.id === id);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser as User;
  }

  public authenticate(email: string, passwordAttempt: string): { user: User; token: string } | null {
    const user = this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (user.password && user.password !== passwordAttempt) {
      return null;
    }
    const token = this.createSession(user.id);
    const { password: _, ...safeUser } = user;
    return { user: safeUser as User, token };
  }

  public listUsers(role?: string): User[] {
    let list = this.state.users;
    if (role) {
      list = list.filter((u) => u.role === role);
    }
    return list.map((u) => {
      const { password: _, ...safeUser } = u;
      return safeUser as User;
    });
  }

  // Tickets
  public listTickets(user: User): Ticket[] {
    let list = [...this.state.tickets];

    // CRITICAL SECURITY REQUIREMENT:
    // A student MUST NEVER be able to view another student's tickets
    if (user.role === 'student') {
      list = list.filter((t) => t.studentId === user.id);
      // Strip internal notes
      return list.map((t) => {
        const { internalNotes: _, ...safeTicket } = t;
        return safeTicket as Ticket;
      });
    }

    return list;
  }

  public getTicketById(id: string, user: User): { ticket: Ticket | null; forbidden?: boolean } {
    const ticket = this.state.tickets.find((t) => t.id === id);
    if (!ticket) {
      return { ticket: null };
    }

    // Role check
    if (user.role === 'student') {
      if (ticket.studentId !== user.id) {
        return { ticket: null, forbidden: true };
      }
      // Strip internal notes
      const { internalNotes: _, ...safeTicket } = ticket;
      return { ticket: safeTicket as Ticket };
    }

    return { ticket };
  }

  public createTicket(
    student: User,
    data: {
      category: Ticket['category'];
      subject: string;
      description: string;
      priority: TicketPriority;
    }
  ): Ticket {
    const nextSeq = this.state.tickets.length + 101;
    const ticketId = `TIK-2026-${nextSeq}`;
    const now = new Date();
    const slaHours = SLA_HOURS_MAP[data.priority] || 24;
    const deadline = new Date(now.getTime() + slaHours * 3600 * 1000);

    const newTicket: Ticket = {
      id: ticketId,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentDepartment: student.department,
      category: data.category,
      subject: data.subject.trim(),
      description: data.description.trim(),
      priority: data.priority,
      status: 'New',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      slaHours,
      slaDeadline: deadline.toISOString(),
      comments: [],
      internalNotes: [],
      activities: [
        {
          id: `act-${Date.now()}-1`,
          ticketId,
          type: 'created',
          actorId: student.id,
          actorName: student.name,
          actorRole: student.role,
          details: `Ticket created with ${data.priority} priority under ${data.category}`,
          timestamp: now.toISOString(),
        },
      ],
    };

    this.state.tickets.unshift(newTicket);
    this.save();
    return newTicket;
  }

  public updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    actor: User,
    resolutionNotes?: string
  ): { ticket: Ticket | null; error?: string } {
    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return { ticket: null, error: 'Ticket not found' };

    // Validate student privileges
    if (actor.role === 'student') {
      if (ticket.studentId !== actor.id) return { ticket: null, error: 'Unauthorized' };
      // Student can only reopen resolved tickets
      if (newStatus !== 'Reopened') {
        return { ticket: null, error: 'Students can only reopen resolved tickets' };
      }
      if (ticket.status !== 'Resolved') {
        return { ticket: null, error: 'Only resolved tickets can be reopened' };
      }
    }

    const previousStatus = ticket.status;
    const now = new Date().toISOString();
    ticket.status = newStatus;
    ticket.updatedAt = now;

    let activityType: any = 'status_changed';
    let activityDetails = `Status changed from ${previousStatus} to ${newStatus}`;

    if (newStatus === 'Resolved') {
      ticket.resolvedAt = now;
      if (resolutionNotes) {
        ticket.resolutionNotes = resolutionNotes;
      }
      activityType = 'resolved';
      activityDetails = resolutionNotes
        ? `Ticket resolved: "${resolutionNotes}"`
        : 'Ticket marked as resolved';
    } else if (newStatus === 'Reopened') {
      activityType = 'reopened';
      activityDetails = 'Ticket reopened by student';
    } else if (newStatus === 'Closed') {
      ticket.closedAt = now;
      activityType = 'closed';
      activityDetails = 'Ticket permanently closed';
    }

    ticket.activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      type: activityType,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: activityDetails,
      timestamp: now,
    });

    this.save();
    return { ticket };
  }

  public updateTicketPriority(
    ticketId: string,
    newPriority: TicketPriority,
    actor: User
  ): { ticket: Ticket | null; error?: string } {
    if (actor.role === 'student') {
      return { ticket: null, error: 'Only staff and managers can change priority' };
    }

    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return { ticket: null, error: 'Ticket not found' };

    const oldPriority = ticket.priority;
    const now = new Date();
    ticket.priority = newPriority;
    ticket.updatedAt = now.toISOString();

    // Recalculate SLA if not resolved
    if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
      const created = new Date(ticket.createdAt).getTime();
      const slaHours = SLA_HOURS_MAP[newPriority] || 24;
      ticket.slaHours = slaHours;
      ticket.slaDeadline = new Date(created + slaHours * 3600 * 1000).toISOString();
    }

    ticket.activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      type: 'priority_changed',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Priority changed from ${oldPriority} to ${newPriority}`,
      timestamp: now.toISOString(),
    });

    this.save();
    return { ticket };
  }

  public assignTicket(
    ticketId: string,
    targetStaffId: string,
    actor: User
  ): { ticket: Ticket | null; error?: string } {
    if (actor.role === 'student') {
      return { ticket: null, error: 'Only staff and managers can assign tickets' };
    }

    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return { ticket: null, error: 'Ticket not found' };

    const targetStaff = this.state.users.find((u) => u.id === targetStaffId);
    if (!targetStaff) return { ticket: null, error: 'Staff member not found' };

    const previousAssignee = ticket.assignedStaffName;
    const isReassignment = Boolean(ticket.assignedStaffId);
    const now = new Date().toISOString();

    ticket.assignedStaffId = targetStaff.id;
    ticket.assignedStaffName = targetStaff.name;
    ticket.assignedStaffEmail = targetStaff.email;
    ticket.updatedAt = now;

    if (ticket.status === 'New') {
      ticket.status = 'Assigned';
    }

    ticket.activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      type: isReassignment ? 'reassigned' : 'assigned',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: isReassignment
        ? `Reassigned from ${previousAssignee} to ${targetStaff.name}`
        : `Assigned to ${targetStaff.name}`,
      timestamp: now,
    });

    this.save();
    return { ticket };
  }

  public addComment(
    ticketId: string,
    content: string,
    actor: User
  ): { ticket: Ticket | null; error?: string } {
    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return { ticket: null, error: 'Ticket not found' };

    if (actor.role === 'student' && ticket.studentId !== actor.id) {
      return { ticket: null, error: 'Unauthorized' };
    }

    const now = new Date().toISOString();
    const newComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      userAvatar: actor.avatar,
      content: content.trim(),
      createdAt: now,
    };

    ticket.comments.push(newComment);
    ticket.updatedAt = now;

    ticket.activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      type: 'comment_added',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `${actor.name} added a comment`,
      timestamp: now,
    });

    this.save();
    return { ticket };
  }

  public addInternalNote(
    ticketId: string,
    content: string,
    actor: User
  ): { ticket: Ticket | null; error?: string } {
    if (actor.role === 'student') {
      return { ticket: null, error: 'Students cannot add or view internal notes' };
    }

    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return { ticket: null, error: 'Ticket not found' };

    const now = new Date().toISOString();
    if (!ticket.internalNotes) {
      ticket.internalNotes = [];
    }

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      content: content.trim(),
      createdAt: now,
    };

    ticket.internalNotes.push(newNote);
    ticket.updatedAt = now;

    ticket.activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      type: 'note_added',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `${actor.name} added an internal note`,
      timestamp: now,
    });

    this.save();
    return { ticket };
  }

  public escalateTicket(
    ticketId: string,
    reason: string,
    actor: User
  ): { ticket: Ticket | null; error?: string } {
    if (actor.role === 'student') {
      return { ticket: null, error: 'Students cannot escalate tickets' };
    }

    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return { ticket: null, error: 'Ticket not found' };

    const now = new Date().toISOString();
    ticket.escalation = {
      escalatedBy: actor.id,
      escalatedByName: actor.name,
      escalatedByRole: actor.role,
      escalatedAt: now,
      reason: reason.trim(),
      currentOwnerId: ticket.assignedStaffId,
      currentOwnerName: ticket.assignedStaffName,
    };
    ticket.updatedAt = now;

    ticket.activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      type: 'escalated',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Escalated by ${actor.name}: "${reason.trim()}"`,
      timestamp: now,
    });

    this.save();
    return { ticket };
  }
}

export const store = new Store();
