import { eq } from "drizzle-orm";
import express from "express";
import httpStatus from "http-status";
import { db } from "../drizzle/index";
import { users } from "../drizzle/schema/users";
import { links } from "../drizzle/schema/links";
import { authenticateJWT } from "../middlewares/jwtAuth";

const router = express.Router();

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const userQuery = await db
      .select({
        user: users,
        link: links,
      })
      .from(users)
      .leftJoin(links, eq(links.user_id, users.id))
      .where(eq(users.username, username));

    if (userQuery.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const user = userQuery[0].user;
    const userLinks = userQuery
      .map((row) => row.link)
      .filter((link) => link !== null);

    return res.status(httpStatus.OK).json({
      message: "User found",
      user: {
        ...user,
        links: userLinks,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

router.get("/nfc/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const userQuery = await db.select().from(users).where(eq(users.nfc, uuid));
    if (userQuery.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    return res.status(httpStatus.OK).json({
      message: "User found",
      user: userQuery[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

router.post("/", authenticateJWT, async (req, res) => {
  try {
    const data = req.body;
    console.log({ data });

    const userSelect = await db
      .select()
      .from(users)
      .where(eq(users.nfc, data.nfc));

    console.log({ userSelect });

    const [result] = await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.nfc,
        set: data,
      })
      .returning();

    const userCreated = userSelect.length === 0;

    return res.status(httpStatus.OK).json({
      message: userCreated ? "User created" : "User updated",
      data: result,
      userCreated,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
      data: null,
    });
  }
});

export default router;
