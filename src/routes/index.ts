import { eq } from "drizzle-orm";
import express from "express";
import "express-async-errors";
import httpStatus from "http-status";

import { db } from "../drizzle/index";
import { redirects } from "../drizzle/schema/redirects";
import {
  decodeJWT,
  encodeJWT,
  encodeJWTWithExpiry,
  JWTCustomToken,
} from "../utils/JWTRoutes";
import "dotenv/config";
import { authenticateJWT } from "../middlewares/jwtAuth";
import { users } from "../drizzle/schema/users";

const router = express.Router();

/**
 * Root path
 */
router.get("/", (_, res) => {
  res.status(httpStatus.OK).json({
    message: "hack the planet",
  });
});

/**
 * Redirect path
 */
router.get("/jwt/:jwt", async (req, res) => {
  try {
    const { uuid } = decodeJWT(req.params.jwt);

    const result = await db
      .select()
      .from(redirects)
      .where(eq(redirects.uuid, uuid as string));

    if (result.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Redirect not found",
      });
    }

    const nfc = result[0];

    const outData = {
      uuid,
      chainId: nfc.chainId,
      phygital: {
        address: nfc.phyditalContract,
        tokenId: nfc.phyditalTokenId,
      },
      poap: {
        address: nfc.poapContract,
        tokenId: nfc.poapTokenId,
      },
    };

    const redirectUrl = new URL(nfc.url);
    const jwtData = encodeJWT(outData);

    if (redirectUrl.toString().startsWith("https://id.ss-tm.org/user")) {
      const userQuery = await db
        .select()
        .from(users)
        .where(eq(users.nfc, uuid));
      const userExists = userQuery.length === 1;

      if (
        redirectUrl.toString().startsWith("https://id.ss-tm.org/user/register")
      ) {
        if (userExists) {
          console.log("User already exists, updating redirect");
          const username = userQuery[0].username;
          const newUrl = `https://id.ss-tm.org/user/${username}`;
          await db
            .update(redirects)
            .set({ url: newUrl })
            .where(eq(redirects.uuid, uuid));
          redirectUrl.href = newUrl;
        } else {
          console.log("User does not exist, redirecting to register");
          console.log("Setting cookie");
          res.cookie("x-nfc-auth", jwtData, {
            httpOnly: true,
            secure: true,
            domain: ".ss-tm.org",
            sameSite: "lax",
          });
        }
      } else {
        if (userExists) {
          console.log("Setting cookie for poap claiming");
          const data = encodeJWTWithExpiry(
            { ...outData, user: userQuery },
            "1m"
          );
          res.cookie("x-poap-auth", data, {
            httpOnly: true,
            secure: true,
            domain: ".ss-tm.org",
            sameSite: "lax",
          });
        }
      }
    } else {
      redirectUrl.searchParams.set("NFT_JWT", jwtData);
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

router.get("/auth", authenticateJWT, async (req, res) => {
  return res.status(httpStatus.OK).json({
    message: "You are authenticated " + req.jwt?.uuid,
    jwt: req.jwt,
  });
});

router.get("/auth/user", authenticateJWT, async (req, res) => {
  try {
    const jwt = req.jwt as JWTCustomToken;
    const userQuery = await db
      .select()
      .from(users)
      .where(eq(users.nfc, jwt.uuid));
    if (userQuery.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
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

router.get("/redirects", authenticateJWT, async (req, res) => {
  try {
    const result = await db
      .select()
      .from(redirects)
      .orderBy(redirects.createdAt);
    const BASE_HOST = `${req.protocol}://${req.get("host")}`;
    const buildLink = (jwt: Record<string, any>) =>
      `${BASE_HOST}/jwt/${encodeJWT({ uuid: jwt.uuid })}`;
    const results = result.map((row) => ({
      ...row,
      link: buildLink(row),
    }));
    res.status(httpStatus.OK).json(results);
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

router.post("/redirects", authenticateJWT, async (req, res) => {
  try {
    const redirectsData = req.body;

    if (!Array.isArray(redirectsData) || redirectsData.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Invalid input data",
        data: null,
      });
    }

    const result = await db.insert(redirects).values(redirectsData).returning();
    const BASE_HOST = `${req.protocol}://${req.get("host")}`;
    const buildLink = (uuid: string) =>
      `${BASE_HOST}/jwt/${encodeJWT({ uuid })}`;
    const resultsWithLinks = result.map((row) => ({
      ...row,
      link: buildLink(row.uuid),
    }));

    return res.status(httpStatus.CREATED).json({
      message: "Redirects inserted successfully",
      data: resultsWithLinks,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
      data: null,
    });
  }
});

router.put("/redirects/:uuid", authenticateJWT, async (req, res) => {
  try {
    const { uuid } = req.params;
    const updateData = req.body;

    const result = await db
      .update(redirects)
      .set(updateData)
      .where(eq(redirects.uuid, uuid))
      .returning();

    if (!result) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Redirect not found",
        data: null,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Redirect updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
      data: null,
    });
  }
});

router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const userQuery = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
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

router.get("/user/nfc/:uuid", async (req, res) => {
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

router.get("/redirect/:uuid/poap", async (req, res) => {
  try {
    const { uuid } = req.params;
    // fetch user POAP from the 'redirects' table
    const redirectQuery = await db
      .select()
      .from(redirects)
      .where(eq(redirects.uuid, uuid));
    if (redirectQuery.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User POAP not found",
      });
    }

    const { poapContract, poapTokenId, chainId } = redirectQuery[0];
    const poapData = {
      address: poapContract,
      tokenId: poapTokenId,
      chainId,
    };

    return res.status(httpStatus.OK).json({
      message: "User POAP found",
      data: poapData,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

router.post("/user", authenticateJWT, async (req, res) => {
  try {
    const data = req.body;
    console.log({ data });

    const result = await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.nfc,
        set: data,
      })
      .returning();

    return res.status(httpStatus.OK).json({
      message: "User found",
      data: result,
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
