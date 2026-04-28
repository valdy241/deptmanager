import type { IncomingMessage, ServerResponse } from "http";
import { authenticateRequest } from "./local/auth";

export type TrpcContext = {
  user: Awaited<ReturnType<typeof authenticateRequest>> | null;
  req: Request;
  resHeaders: Headers;
};

export async function createContext({
  req,
  resHeaders,
}: {
  req: Request;
  resHeaders: Headers;
}): Promise<TrpcContext> {
  let user: TrpcContext["user"] = null;
  try {
    user = await authenticateRequest(req.headers);
  } catch {
    // Not authenticated
  }
  return { user, req, resHeaders };
}
