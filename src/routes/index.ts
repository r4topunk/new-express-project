import { eq } from "drizzle-orm";
import express from "express";
import "express-async-errors";
import httpStatus from "http-status";

import { db } from "../drizzle/index";
import { redirects } from "../drizzle/schema/redirects";
import { decodeJWT, encodeJWT } from "../utils/JWTRoutes";
import "dotenv/config";

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

export default router;
