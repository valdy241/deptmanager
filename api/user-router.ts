import { z } from "zod";
import { nanoid } from "nanoid";
import { createRouter, authedQuery, adminOrSuperQuery, superAdminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq, like, desc, and, sql } from "drizzle-orm";

export const userRouter = createRouter({
  list: adminOrSuperQuery
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        departmentId: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const whereConditions = [];

      if (input?.search) {
        whereConditions.push(like(users.name, `%${input.search}%`));
      }
      if (input?.role) {
        whereConditions.push(sql`${users.role} = ${input.role}`);
      }
      if (input?.departmentId) {
        whereConditions.push(eq(users.departmentId, input.departmentId));
      }

      // Admin can only see users, not super_admins
      if (ctx.user.role === "admin") {
        whereConditions.push(sql`${users.role} = 'user'`);
        if (ctx.user.departmentId) {
          whereConditions.push(eq(users.departmentId, ctx.user.departmentId));
        }
      }

      const condition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatar: users.avatar,
            role: users.role,
            departmentId: users.departmentId,
            createdAt: users.createdAt,
            lastSignInAt: users.lastSignInAt,
          })
          .from(users)
          .where(condition)
          .orderBy(desc(users.createdAt))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(users).where(condition),
      ]);

      return { items, total: countResult[0].count };
    }),

  getById: adminOrSuperQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: adminOrSuperQuery
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "user"]),
        departmentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Admin can only create users
      if (ctx.user.role === "admin" && input.role !== "user") {
        throw new Error("Admins can only create users");
      }

      const unionId = `local_${nanoid()}`;
      const result = await db.insert(users).values({
        unionId,
        name: input.name,
        email: input.email,
        role: input.role,
        departmentId: input.departmentId ?? null,
      });

      return { id: Number((result as any)[0].insertId), success: true };
    }),

  update: adminOrSuperQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["super_admin", "admin", "user"]).optional(),
        departmentId: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      // Admin can only update users in their department
      if (ctx.user.role === "admin") {
        const targetUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (targetUser[0]?.role !== "user") {
          throw new Error("Admins can only modify users");
        }
        if (ctx.user.departmentId && targetUser[0]?.departmentId !== ctx.user.departmentId) {
          throw new Error("Cannot modify users from other departments");
        }
      }

      await db.update(users).set(updates).where(eq(users.id, id));
      return { success: true };
    }),

  delete: superAdminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),

  me: authedQuery.query((opts) => opts.ctx.user),

  listAll: adminOrSuperQuery.query(async () => {
    const db = getDb();
    return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
  }),
});
