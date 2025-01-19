import { and, eq } from "drizzle-orm";
import express from "express";
import "express-async-errors";
import httpStatus from "http-status";

import "dotenv/config";
import { db } from "../drizzle/index";
import { redirects } from "../drizzle/schema/redirects";
import { users } from "../drizzle/schema/users";
import { authenticateJWT } from "../middlewares/jwtAuth";
import { decodeJWT, encodeJWT, JWTCustomToken } from "../utils/JWTRoutes";
import { nftClaims } from "../drizzle/schema/nftClaims";
import { equal } from "node:assert";

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
          const data = encodeJWT({ ...outData, user: userQuery });
          res.cookie("x-poap-auth", data, {
            httpOnly: true,
            secure: true,
            domain: ".ss-tm.org",
            sameSite: "lax",
            maxAge: 5 * 60 * 1000, // 5 minutes
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

router.post("/claim-nft", authenticateJWT, async (req, res) => {
  try {
    const { user_address, token_address, token_id, chain_id } = req.body;
    console.log("Claiming nft for:", {
      user_address,
      token_address,
      token_id,
      chain_id,
    });

    if (!user_address || !token_address || !token_id || !chain_id) {
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

    if (!user_address || !poapContract || !poapTokenId || !chainId) {
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
