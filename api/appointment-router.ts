import { z } from "zod";
import { createRouter, authedQuery, adminOrSuperQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appointments, appointmentParticipants, notifications } from "@db/schema";
import { eq, desc, and, or, sql, gte } from "drizzle-orm";

export const appointmentRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const whereConditions = [];

      if (input?.startDate) {
        whereConditions.push(gte(appointments.startTime, input.startDate));
      }
      if (input?.endDate) {
        whereConditions.push(gte(appointments.endTime, input.endDate));
      }
      if (input?.search) {
        whereConditions.push(sql`${appointments.title} LIKE ${`%${input.search}%`}`);
      }

      if (ctx.user.role === "user") {
        // Get appointments where user is participant or creator
        const participantAppts = await db
          .select({ appointmentId: appointmentParticipants.appointmentId })
          .from(appointmentParticipants)
          .where(eq(appointmentParticipants.userId, ctx.user.id));
        const appointmentIds = participantAppts.map(p => p.appointmentId);
        if (appointmentIds.length > 0) {
          whereConditions.push(
            or(
              eq(appointments.createdBy, ctx.user.id),
              sql`${appointments.id} IN (${sql.join(appointmentIds.map(id => sql`${id}`), sql`, `)})`
            )
          );
        } else {
          whereConditions.push(eq(appointments.createdBy, ctx.user.id));
        }
      } else if (ctx.user.role === "admin" && ctx.user.departmentId) {
        whereConditions.push(eq(appointments.departmentId, ctx.user.departmentId));
      }

      const condition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(appointments)
          .where(condition)
          .orderBy(desc(appointments.startTime))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(appointments).where(condition),
      ]);

      return { items, total: countResult[0].count };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
      const appt = result[0];
      if (!appt) return null;

      const participants = await db
        .select()
        .from(appointmentParticipants)
        .where(eq(appointmentParticipants.appointmentId, input.id));

      return { ...appt, participants };
    }),

  create: adminOrSuperQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startTime: z.date(),
        endTime: z.date(),
        location: z.string().optional(),
        departmentId: z.number().optional(),
        participantIds: z.array(z.number()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(appointments).values({
        title: input.title,
        description: input.description ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location ?? null,
        createdBy: ctx.user.id,
        departmentId: input.departmentId ?? ctx.user.departmentId ?? null,
      });

      const appointmentId = Number((result as any)[0].insertId);

      // Add participants
      if (input.participantIds.length > 0) {
        const values = input.participantIds.map(userId => ({
          appointmentId,
          userId,
          status: "pending" as const,
        }));
        await db.insert(appointmentParticipants).values(values);

        // Notify participants
        for (const userId of input.participantIds) {
          await db.insert(notifications).values({
            userId,
            type: "appointment",
            title: "Nouveau rendez-vous",
            message: `Rendez-vous "${input.title}" le ${input.startTime.toLocaleDateString()}`,
            relatedId: appointmentId,
          });
        }
      }

      return { id: appointmentId, success: true };
    }),

  update: adminOrSuperQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional().nullable(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        location: z.string().optional().nullable(),
        participantIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, participantIds, ...updates } = input;

      await db.update(appointments).set(updates).where(eq(appointments.id, id));

      if (participantIds !== undefined) {
        // Delete old participants and add new ones
        await db.delete(appointmentParticipants).where(eq(appointmentParticipants.appointmentId, id));
        if (participantIds.length > 0) {
          const values = participantIds.map(userId => ({
            appointmentId: id,
            userId,
            status: "pending" as const,
          }));
          await db.insert(appointmentParticipants).values(values);
        }
      }

      return { success: true };
    }),

  delete: adminOrSuperQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(appointmentParticipants).where(eq(appointmentParticipants.appointmentId, input.id));
      await db.delete(appointments).where(eq(appointments.id, input.id));
      return { success: true };
    }),

  respondToInvitation: authedQuery
    .input(
      z.object({
        appointmentId: z.number(),
        status: z.enum(["accepted", "declined"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(appointmentParticipants)
        .set({ status: input.status })
        .where(
          and(
            eq(appointmentParticipants.appointmentId, input.appointmentId),
            eq(appointmentParticipants.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
