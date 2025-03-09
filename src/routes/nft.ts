import { and, eq } from "drizzle-orm";
import express from "express";
import httpStatus from "http-status";
import { db } from "../drizzle/index";
import { nftClaims } from "../drizzle/schema/nftClaims";
import { redirects } from "../drizzle/schema/redirects";
import { authenticateJWT } from "../middlewares/jwtAuth";
import { JWTCustomToken } from "../utils/JWTRoutes";

const router = express.Router();

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

router.post("/claim-nft", authenticateJWT, async (req, res) => {
  try {
    const { user_address, token_address, token_id, chain_id } = req.body;
    console.log("Claiming nft for:", {
      user_address,
      token_address,
      token_id,
      chain_id,
    });

    if (
      !user_address ||
      !token_address ||
      typeof token_id !== "number" ||
      !chain_id
    ) {
      console.log("Invalid input data", {
        user_address,
        token_address,
        token_id,
        chain_id,
      });
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Invalid input data",
        data: null,
      });
    }

    const result = await db
      .insert(nftClaims)
      .values({
        user_address,
        token_address,
        token_id,
        chain_id,
      })
      .returning();

    return res.status(httpStatus.OK).json({
      message: "NFT claim recorded",
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

router.post("/tokengate/uuid", async (req, res) => {
  const { uuid, user_address } = req.body;
  console.log("Checking token claim for:", { uuid, user_address });

  try {
    // Fetch the redirect data using the uuid
    const [redirect] = await db
      .select()
      .from(redirects)
      .where(eq(redirects.uuid, uuid));

    if (
      !redirect ||
      !redirect.poapContract ||
      !redirect.poapTokenId ||
      !redirect.chainId
    ) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "POAP data not found for the given UUID",
        hasToken: false,
      });
    }

    // Check if the user has claimed the token
    const [claim] = await db
      .select()
      .from(nftClaims)
      .where(
        and(
          eq(nftClaims.user_address, user_address),
          eq(nftClaims.token_address, redirect.poapContract),
          eq(nftClaims.token_id, redirect.poapTokenId),
          eq(nftClaims.chain_id, redirect.chainId)
        )
      );

    if (claim) {
      return res.status(httpStatus.OK).json({
        message: "Token claim exists",
        hasToken: true,
      });
    } else {
      return res.status(httpStatus.OK).json({
        message: "Token claim does not exist",
        hasToken: false,
        poap: {
          address: redirect.poapContract,
          tokenId: redirect.poapTokenId,
          chainId: redirect.chainId,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
      hasToken: false,
    });
  }
});

router.post("/tokengate", authenticateJWT, async (req, res) => {
  try {
    const { user_address } = req.body;
    const jwt = req.jwt as JWTCustomToken;
    const [redirect] = await db
      .select()
      .from(redirects)
      .where(eq(redirects.uuid, jwt.uuid));
    if (!redirect) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Redirect not found",
        hasToken: false,
      });
    }

    const { chainId, poapContract, poapTokenId } = redirect;

    console.log("Checking token claim for:", {
      user_address,
      chainId,
      poapContract,
      poapTokenId,
    });

    if (
      !user_address ||
      !poapContract ||
      typeof poapTokenId !== "number" ||
      !chainId
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Invalid input data",
        hasToken: false,
      });
    }

    const [claim] = await db
      .select()
      .from(nftClaims)
      .where(
        and(
          eq(nftClaims.user_address, user_address),
          eq(nftClaims.token_address, poapContract),
          eq(nftClaims.token_id, poapTokenId),
          eq(nftClaims.chain_id, chainId)
        )
      );

    if (claim) {
      return res.status(httpStatus.OK).json({
        message: "Token claim exists",
        hasToken: true,
      });
    } else {
      return res.status(httpStatus.OK).json({
        message: "Token claim does not exist",
        hasToken: false,
        poap: {
          address: poapContract,
          tokenId: poapTokenId,
          chainId,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
      hasToken: false,
    });
  }
});

export default router;
