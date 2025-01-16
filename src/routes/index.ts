import { eq } from "drizzle-orm";
import express from "express";
import "express-async-errors";
import httpStatus from "http-status";

import { db } from "../drizzle/index";
import { redirects } from "../drizzle/schema/redirects";
import { decodeJWT, encodeJWT, JWTCustomToken } from "../utils/JWTRoutes";
import "dotenv/config";
import { authenticateJWT } from "../middlewares/jwtAuth";

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
    redirectUrl.searchParams.set("NFT_JWT", jwtData);

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
  });
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

export default router;
