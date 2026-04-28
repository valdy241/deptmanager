import { z } from "zod";
import { createRouter, authedQuery, adminOrSuperQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tasks, notifications } from "@db/schema";
import { eq, desc, like, and, or, sql } from "drizzle-orm";

export const taskRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        assignedTo: z.number().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const whereConditions = [];

      if (input?.status) {
        whereConditions.push(sql`${tasks.status} = ${input.status}`);
      }
      if (input?.priority) {
        whereConditions.push(sql`${tasks.priority} = ${input.priority}`);
      }
      if (input?.assignedTo) {
        whereConditions.push(eq(tasks.assignedTo, input.assignedTo));
      }
      if (input?.search) {
        whereConditions.push(like(tasks.title, `%${input.search}%`));
      }

      // Users can only see their own tasks or tasks they created
      if (ctx.user.role === "user") {
        whereConditions.push(
          or(eq(tasks.assignedTo, ctx.user.id), eq(tasks.createdBy, ctx.user.id))
        );
      } else if (ctx.user.role === "admin" && ctx.user.departmentId) {
        whereConditions.push(eq(tasks.departmentId, ctx.user.departmentId));
      }

      const condition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
            status: tasks.status,
            priority: tasks.priority,
            createdBy: tasks.createdBy,
            assignedTo: tasks.assignedTo,
            dueDate: tasks.dueDate,
            completedAt: tasks.completedAt,
            departmentId: tasks.departmentId,
            createdAt: tasks.createdAt,
            updatedAt: tasks.updatedAt,
          })
          .from(tasks)
          .where(condition)
          .orderBy(desc(tasks.createdAt))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(tasks).where(condition),
      ]);

      return { items, total: countResult[0].count };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(tasks).where(eq(tasks.id, input.id)).limit(1);
      const task = result[0];
      if (!task) return null;

      // Authorization check
      if (ctx.user.role === "user" && task.assignedTo !== ctx.user.id && task.createdBy !== ctx.user.id) {
        return null;
      }
      if (ctx.user.role === "admin" && task.departmentId && task.departmentId !== ctx.user.departmentId) {
        return null;
      }

      return task;
    }),

  create: adminOrSuperQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
        departmentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(tasks).values({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        createdBy: ctx.user.id,
        assignedTo: input.assignedTo ?? null,
        dueDate: input.dueDate ?? null,
        departmentId: input.departmentId ?? ctx.user.departmentId ?? null,
      });

      const taskId = Number((result as any)[0].insertId);

      // Create notification for assigned user
      if (input.assignedTo) {
        await db.insert(notifications).values({
          userId: input.assignedTo,
          type: "task",
          title: "Nouvelle tâche assignée",
          message: `Vous avez été assigné à la tâche "${input.title}"`,
          relatedId: taskId,
        });
      }

      return { id: taskId, success: true };
    }),

  update: adminOrSuperQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional().nullable(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedTo: z.number().optional().nullable(),
        dueDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      if (updates.status === "completed") {
        (updates as any).completedAt = new Date();
      }

      await db.update(tasks).set(updates).where(eq(tasks.id, id));

      // Notify assignee if changed
      if (updates.assignedTo) {
        const task = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
        if (task[0]) {
          await db.insert(notifications).values({
            userId: updates.assignedTo,
            type: "task",
            title: "Tâche réassignée",
            message: `Vous avez été assigné à la tâche "${task[0].title}"`,
            relatedId: id,
          });
        }
      }

      return { success: true };
    }),

  delete: adminOrSuperQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(tasks).where(eq(tasks.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const whereConditions = [];

    if (ctx.user.role === "user") {
      whereConditions.push(or(eq(tasks.assignedTo, ctx.user.id), eq(tasks.createdBy, ctx.user.id)));
    } else if (ctx.user.role === "admin" && ctx.user.departmentId) {
      whereConditions.push(eq(tasks.departmentId, ctx.user.departmentId));
    }

    const condition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const allTasks = await db.select().from(tasks).where(condition);

    return {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === "pending").length,
      inProgress: allTasks.filter(t => t.status === "in_progress").length,
      completed: allTasks.filter(t => t.status === "completed").length,
      urgent: allTasks.filter(t => t.priority === "urgent").length,
    };
  }),
});
