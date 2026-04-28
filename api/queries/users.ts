import { eq, sql } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return rows.at(0);
}

export async function createUser(data: InsertUser) {
  // First user ever gets super_admin
  const countResult = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(schema.users);
  const count = Number(countResult[0]?.count ?? 0);

  const values = {
    ...data,
    email: data.email?.toLowerCase(),
    role: count === 0 ? ("super_admin" as const) : (data.role ?? "user"),
  };

  const result = await getDb().insert(schema.users).values(values);
  return { id: Number((result as any)[0].insertId) };
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  // First user ever gets super_admin
  if (values.role === undefined) {
    const countResult = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);
    const count = Number(countResult[0]?.count ?? 0);
    if (count === 0) {
      values.role = "super_admin";
      updateSet.role = "super_admin";
    }
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
