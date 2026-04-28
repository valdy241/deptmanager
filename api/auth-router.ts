import * as cookie from "cookie";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./local/auth";
import { findUserByEmail, createUser } from "./queries/users";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => {
    const { passwordHash, ...user } = opts.ctx.user as any;
    return user;
  }),

  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2, "Nom trop court").max(100),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Mot de passe trop court (8 caractères min)"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new Error("Un compte avec cet email existe déjà.");
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const unionId = `local_${nanoid()}`;

      const { id } = await createUser({
        unionId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({ unionId });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return { success: true, userId: id };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email("Email invalide"),
        password: z.string().min(1, "Mot de passe requis"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await findUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new Error("Email ou mot de passe incorrect.");
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Email ou mot de passe incorrect.");
      }

      const token = await signSessionToken({ unionId: user.unionId });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return { success: true };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );
    return { success: true };
  }),
});
