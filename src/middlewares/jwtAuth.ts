import { Request, Response, NextFunction } from "express";
import { decodeJWT } from "../utils/JWTRoutes";

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = decodeJWT(token);
    req.jwt = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
