import { z } from "zod";
import { createRouter, adminOrSuperQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { departments } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const departmentRouter = createRouter({
  list: adminOrSuperQuery.query(async () => {
    const db = getDb();
    return db.select().from(departments).orderBy(desc(departments.createdAt));
  }),

  create: adminOrSuperQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(departments).values({
        name: input.name,
        description: input.description ?? null,
        createdBy: ctx.user.id,
      });
      return { id: Number((result as any)[0].insertId), success: true };
    }),

  update: adminOrSuperQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      await db.update(departments).set(updates).where(eq(departments.id, id));
      return { success: true };
    }),

  delete: adminOrSuperQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(departments).where(eq(departments.id, input.id));
      return { success: true };
    }),
});
