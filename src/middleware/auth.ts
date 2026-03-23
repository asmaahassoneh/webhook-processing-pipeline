import { NextFunction, Request, Response } from "express";

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    res.status(500).json({ error: "API_KEY is not configured" });
    return;
  }

  const providedKey = req.header("x-api-key");

  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
