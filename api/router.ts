import { authRouter } from "./auth-router";
import { userRouter } from "./user-router";
import { departmentRouter } from "./department-router";
import { taskRouter } from "./task-router";
import { documentRouter } from "./document-router";
import { appointmentRouter } from "./appointment-router";
import { notificationRouter } from "./notification-router";
import { dashboardRouter } from "./dashboard-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  user: userRouter,
  department: departmentRouter,
  task: taskRouter,
  document: documentRouter,
  appointment: appointmentRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
