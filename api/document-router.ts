import { z } from "zod";
import { createRouter, authedQuery, adminOrSuperQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { documents } from "@db/schema";
import { eq, desc, like, and, or, sql } from "drizzle-orm";

export const documentRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        departmentId: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const whereConditions = [];

      if (input?.category) {
        whereConditions.push(eq(documents.category, input.category));
      }
      if (input?.search) {
        whereConditions.push(like(documents.title, `%${input.search}%`));
      }
      if (input?.departmentId) {
        whereConditions.push(eq(documents.departmentId, input.departmentId));
      }

      // Users can only see public docs or docs from their department
      if (ctx.user.role === "user") {
        whereConditions.push(
          or(
            eq(documents.isPublic, true),
            eq(documents.departmentId, ctx.user.departmentId ?? 0)
          )
        );
      } else if (ctx.user.role === "admin" && ctx.user.departmentId) {
        whereConditions.push(
          or(
            eq(documents.departmentId, ctx.user.departmentId),
            eq(documents.createdBy, ctx.user.id)
          )
        );
      }

      const condition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(documents)
          .where(condition)
          .orderBy(desc(documents.createdAt))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(documents).where(condition),
      ]);

      return { items, total: countResult[0].count };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(documents).where(eq(documents.id, input.id)).limit(1);
      const doc = result[0];
      if (!doc) return null;

      if (ctx.user.role === "user" && !doc.isPublic && doc.departmentId !== ctx.user.departmentId) {
        return null;
      }

      return doc;
    }),

  create: adminOrSuperQuery
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        fileUrl: z.string().optional(),
        category: z.string().optional(),
        departmentId: z.number().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(documents).values({
        title: input.title,
        content: input.content ?? null,
        fileUrl: input.fileUrl ?? null,
        category: input.category ?? null,
        createdBy: ctx.user.id,
        departmentId: input.departmentId ?? ctx.user.departmentId ?? null,
        isPublic: input.isPublic,
      });

      return { id: Number((result as any)[0].insertId), success: true };
    }),

  update: adminOrSuperQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional().nullable(),
        fileUrl: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      await db.update(documents).set(updates).where(eq(documents.id, id));
      return { success: true };
    }),

  delete: adminOrSuperQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),
});
