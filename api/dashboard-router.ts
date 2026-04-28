import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, tasks, appointments, documents, notifications, departments } from "@db/schema";
import { eq, and, or, desc, sql, gte } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = ctx.user;

    let userFilter = undefined;
    let taskFilter = undefined;
    let apptFilter = undefined;
    let docFilter = undefined;

    if (user.role === "user") {
      taskFilter = or(eq(tasks.assignedTo, user.id), eq(tasks.createdBy, user.id));
      apptFilter = or(eq(appointments.createdBy, user.id));
      docFilter = or(eq(documents.isPublic, true), eq(documents.departmentId, user.departmentId ?? 0));
    } else if (user.role === "admin" && user.departmentId) {
      userFilter = eq(users.departmentId, user.departmentId);
      taskFilter = eq(tasks.departmentId, user.departmentId);
      apptFilter = eq(appointments.departmentId, user.departmentId);
      docFilter = eq(documents.departmentId, user.departmentId);
    }

    const [
      userCount,
      taskCount,
      appointmentCount,
      documentCount,
      notificationCount,
      departmentCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users).where(userFilter),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(taskFilter),
      db.select({ count: sql<number>`count(*)` }).from(appointments).where(apptFilter),
      db.select({ count: sql<number>`count(*)` }).from(documents).where(docFilter),
      db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.userId, user.id)),
      db.select({ count: sql<number>`count(*)` }).from(departments),
    ]);

    // Recent tasks
    const recentTasks = await db
      .select()
      .from(tasks)
      .where(taskFilter)
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    // Recent appointments
    const recentAppointments = await db
      .select()
      .from(appointments)
      .where(apptFilter)
      .orderBy(desc(appointments.startTime))
      .limit(5);

    // Upcoming appointments (next 7 days)
    const now = new Date();
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          apptFilter,
          gte(appointments.startTime, now)
        )
      )
      .orderBy(appointments.startTime)
      .limit(5);

    // Unread notifications
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(5);

    return {
      counts: {
        users: userCount[0].count,
        tasks: taskCount[0].count,
        appointments: appointmentCount[0].count,
        documents: documentCount[0].count,
        notifications: notificationCount[0].count,
        departments: departmentCount[0].count,
      },
      recentTasks,
      recentAppointments,
      upcomingAppointments,
      unreadNotifications,
    };
  }),
});
