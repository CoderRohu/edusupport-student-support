import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { store } from './server/data/store';
import { User, Ticket, DashboardMetrics, TicketCategory, TicketPriority, TicketStatus, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from './src/types';
import { calculateSLA, calculateAgeing } from './src/utils/sla';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface AuthenticatedRequest extends Request {
  user?: User;
}

// Auth Middleware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const user = store.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid token' });
    return;
  }
  req.user = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  const router = express.Router();

  // Auth: Login
  router.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = store.authenticate(email, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.json(result);
  });

  // Auth: Get current user
  router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Auth: Logout
  router.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (token) {
      store.removeSession(token);
    }
    res.json({ success: true });
  });

  // Users: List users (with optional role filter)
  router.get('/users', requireAuth, (req: AuthenticatedRequest, res) => {
    const role = req.query.role as string | undefined;
    const users = store.listUsers(role);
    res.json({ users });
  });

  // Tickets: List tickets
  router.get('/tickets', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    let tickets = store.listTickets(user);

    // Filters
    const { search, status, priority, category, assignedStaffId, view } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q) ||
          (t.assignedStaffName && t.assignedStaffName.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string' && status !== 'all') {
      tickets = tickets.filter((t) => t.status === status);
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      tickets = tickets.filter((t) => t.priority === priority);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      tickets = tickets.filter((t) => t.category === category);
    }

    if (assignedStaffId && typeof assignedStaffId === 'string' && assignedStaffId !== 'all') {
      if (assignedStaffId === 'unassigned') {
        tickets = tickets.filter((t) => !t.assignedStaffId);
      } else {
        tickets = tickets.filter((t) => t.assignedStaffId === assignedStaffId);
      }
    }

    // Role-specific view filters
    if (view === 'my_tickets' && user.role === 'staff') {
      tickets = tickets.filter((t) => t.assignedStaffId === user.id);
    } else if (view === 'unassigned' && (user.role === 'staff' || user.role === 'manager')) {
      tickets = tickets.filter((t) => !t.assignedStaffId);
    } else if (view === 'escalated' && (user.role === 'staff' || user.role === 'manager')) {
      tickets = tickets.filter((t) => Boolean(t.escalation));
    } else if (view === 'overdue') {
      tickets = tickets.filter((t) => {
        const sla = calculateSLA(t);
        return sla.state === 'overdue';
      });
    } else if (view === 'due_soon') {
      tickets = tickets.filter((t) => {
        const sla = calculateSLA(t);
        return sla.state === 'due_soon';
      });
    }

    res.json({ tickets });
  });

  // Tickets: Create ticket
  router.post('/tickets', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description || !priority) {
      res.status(400).json({ error: 'All fields (category, subject, description, priority) are required' });
      return;
    }

    if (!TICKET_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    if (!TICKET_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: 'Invalid priority' });
      return;
    }

    const ticket = store.createTicket(user, {
      category,
      subject,
      description,
      priority,
    });

    res.status(201).json({ ticket });
  });

  // Tickets: Get single ticket details
  router.get('/tickets/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { ticket, forbidden } = store.getTicketById(req.params.id, user);

    if (forbidden) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to access this ticket' });
      return;
    }

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json({ ticket });
  });

  // Tickets: Update status
  router.patch('/tickets/:id/status', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { status, resolutionNotes } = req.body;

    if (!status || !TICKET_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid or missing status' });
      return;
    }

    if (status === 'Resolved' && (!resolutionNotes || !resolutionNotes.trim())) {
      res.status(400).json({ error: 'Resolution notes are required when resolving a ticket' });
      return;
    }

    const result = store.updateTicketStatus(req.params.id, status, user, resolutionNotes);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    const safeResult = store.getTicketById(req.params.id, user);
    res.json({ ticket: safeResult.ticket });
  });

  // Tickets: Update priority
  router.patch('/tickets/:id/priority', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { priority } = req.body;

    if (!priority || !TICKET_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: 'Invalid or missing priority' });
      return;
    }

    const result = store.updateTicketPriority(req.params.id, priority, user);
    if (result.error) {
      res.status(403).json({ error: result.error });
      return;
    }

    const safeResult = store.getTicketById(req.params.id, user);
    res.json({ ticket: safeResult.ticket });
  });

  // Tickets: Assign / Reassign
  router.patch('/tickets/:id/assign', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { staffId } = req.body;

    if (!staffId) {
      res.status(400).json({ error: 'Staff ID is required' });
      return;
    }

    const result = store.assignTicket(req.params.id, staffId, user);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    const safeResult = store.getTicketById(req.params.id, user);
    res.json({ ticket: safeResult.ticket });
  });

  // Tickets: Add public comment
  router.post('/tickets/:id/comments', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty' });
      return;
    }

    const result = store.addComment(req.params.id, content, user);
    if (result.error) {
      res.status(403).json({ error: result.error });
      return;
    }

    const safeResult = store.getTicketById(req.params.id, user);
    res.json({ ticket: safeResult.ticket });
  });

  // Tickets: Add internal note (Staff / Manager only)
  router.post('/tickets/:id/notes', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Internal note content cannot be empty' });
      return;
    }

    const result = store.addInternalNote(req.params.id, content, user);
    if (result.error) {
      res.status(403).json({ error: result.error });
      return;
    }

    const safeResult = store.getTicketById(req.params.id, user);
    res.json({ ticket: safeResult.ticket });
  });

  // Tickets: Escalate ticket
  router.post('/tickets/:id/escalate', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Escalation reason cannot be empty' });
      return;
    }

    const result = store.escalateTicket(req.params.id, reason, user);
    if (result.error) {
      res.status(403).json({ error: result.error });
      return;
    }

    const safeResult = store.getTicketById(req.params.id, user);
    res.json({ ticket: safeResult.ticket });
  });

  // Dashboard Metrics: Accurate real-time stats
  router.get('/dashboard/stats', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const tickets = store.listTickets(user);

    // Compute metrics
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (t) => t.status === 'New' || t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'Reopened'
    ).length;
    const pendingTickets = tickets.filter(
      (t) => t.status === 'Pending Student' || t.status === 'Pending Internal'
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    ).length;

    let overdueTickets = 0;
    let dueSoonTickets = 0;
    let slaMetCount = 0;
    let totalResolvedDurationHours = 0;
    let resolvedWithTimesCount = 0;

    tickets.forEach((t) => {
      const sla = calculateSLA(t);
      if (sla.state === 'overdue') overdueTickets++;
      if (sla.state === 'due_soon') dueSoonTickets++;

      if (t.status === 'Resolved' || t.status === 'Closed') {
        if (!sla.isBreached) slaMetCount++;
        if (t.resolvedAt) {
          const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
          totalResolvedDurationHours += Math.max(0, diffMs / (3600 * 1000));
          resolvedWithTimesCount++;
        }
      }
    });

    const escalatedTickets = tickets.filter((t) => Boolean(t.escalation)).length;
    const criticalCount = tickets.filter((t) => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
    const highCount = tickets.filter((t) => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length;
    const unassignedCount = tickets.filter((t) => !t.assignedStaffId && t.status !== 'Resolved' && t.status !== 'Closed').length;

    const slaComplianceRate = resolvedTickets > 0
      ? Math.round((slaMetCount / resolvedTickets) * 100)
      : 100;

    const avgResolutionTimeHours = resolvedWithTimesCount > 0
      ? Math.round((totalResolvedDurationHours / resolvedWithTimesCount) * 10) / 10
      : 0;

    // Breakdown by Category
    const byCategory = TICKET_CATEGORIES.map((cat) => ({
      category: cat,
      count: tickets.filter((t) => t.category === cat).length,
    }));

    // Breakdown by Priority
    const byPriority = TICKET_PRIORITIES.map((pri) => ({
      priority: pri,
      count: tickets.filter((t) => t.priority === pri).length,
    }));

    // Breakdown by Status
    const byStatus = TICKET_STATUSES.map((st) => ({
      status: st,
      count: tickets.filter((t) => t.status === st).length,
    }));

    // Staff Workload (for manager/staff)
    let staffWorkload: DashboardMetrics['staffWorkload'] = undefined;
    if (user.role === 'manager' || user.role === 'staff') {
      const staffList = store.listUsers('staff');
      staffWorkload = staffList.map((st) => {
        const active = tickets.filter(
          (t) => t.assignedStaffId === st.id && t.status !== 'Resolved' && t.status !== 'Closed'
        ).length;
        const resolved = tickets.filter(
          (t) => t.assignedStaffId === st.id && (t.status === 'Resolved' || t.status === 'Closed')
        ).length;
        return {
          staffId: st.id,
          staffName: st.name,
          activeCount: active,
          resolvedCount: resolved,
        };
      });
    }

    // Ageing Breakdown (for manager/staff)
    let ageingBreakdown: DashboardMetrics['ageingBreakdown'] = undefined;
    if (user.role === 'manager' || user.role === 'staff') {
      let lessThan24h = 0;
      let oneToThreeDays = 0;
      let fourToSevenDays = 0;
      let moreThanSevenDays = 0;

      const activeTickets = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');
      activeTickets.forEach((t) => {
        const ageing = calculateAgeing(t.createdAt);
        if (ageing.bucket === '24h') lessThan24h++;
        else if (ageing.bucket === '1-3d') oneToThreeDays++;
        else if (ageing.bucket === '4-7d') fourToSevenDays++;
        else moreThanSevenDays++;
      });

      ageingBreakdown = {
        lessThan24h,
        oneToThreeDays,
        fourToSevenDays,
        moreThanSevenDays,
      };
    }

    const metrics: DashboardMetrics = {
      totalTickets,
      openTickets,
      pendingTickets,
      resolvedTickets,
      overdueTickets,
      escalatedTickets,
      slaComplianceRate,
      avgResolutionTimeHours,
      criticalCount,
      highCount,
      unassignedCount,
      dueSoonCount: dueSoonTickets,
      byCategory,
      byPriority,
      byStatus,
      staffWorkload,
      ageingBreakdown,
    };

    res.json({ metrics });
  });

  // Reset Demo Data
  router.post('/reset-demo', requireAuth, (_req, res) => {
    store.resetToSeed();
    res.json({ success: true, message: 'Database reset to seed data' });
  });

  // Mount API router
  app.use('/api', router);

  // In development, hook Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduSupport Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
