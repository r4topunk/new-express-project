import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "./constants";

export interface JWTCustomToken {
  uuid: string;
  iat: number;
  exp: number;
}

/**
 * validate jwt data
 * @param jwtData
 */
export function decodeJWT(jwtData: string): JWTCustomToken {
  const jwtResponse = jwt.verify(jwtData, JWT_SECRET_KEY) as JWTCustomToken;
  return jwtResponse;
}

/**
 * retuns a signed base64 string
 * @param json
 */
export function encodeJWT(json: Record<string, any>): string {
  const token = jwt.sign(json, JWT_SECRET_KEY, { noTimestamp: true });
  return token;
}
