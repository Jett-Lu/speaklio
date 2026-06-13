import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../services/supabase.js";

export interface AuthenticatedRequest extends Request {
  user: User;
  accessToken: string;
}

function getBearerToken(request: Request) {
  const header = request.header("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    response.status(401).json({
      error: "Missing bearer token",
    });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    response.status(401).json({
      error: "Invalid bearer token",
    });
    return;
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = data.user;
  authenticatedRequest.accessToken = accessToken;

  next();
}
