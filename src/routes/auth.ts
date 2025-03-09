import { eq } from "drizzle-orm";
import express from "express";
import httpStatus from "http-status";
import { db } from "../drizzle/index";
import { users } from "../drizzle/schema/users";
import { authenticateJWT } from "../middlewares/jwtAuth";
import { JWTCustomToken } from "../utils/JWTRoutes";

const router = express.Router();

router.get("/", authenticateJWT, async (req, res) => {
  return res.status(httpStatus.OK).json({
    message: "You are authenticated " + req.jwt?.uuid,
    jwt: req.jwt,
  });
});

router.get("/user", authenticateJWT, async (req, res) => {
  try {
    const jwt = req.jwt as JWTCustomToken;
    const userQuery = await db
      .select()
      .from(users)
      .where(eq(users.nfc, jwt.uuid));
    if (userQuery.length === 0) {
      return res.status(httpStatus.OK).json({
        message: "User not found",
        jwt: req.jwt,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "You are authenticated " + req.jwt?.uuid,
      jwt: req.jwt,
      user: userQuery[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

export default router;
