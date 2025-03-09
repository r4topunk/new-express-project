import { eq } from "drizzle-orm";
import express from "express";
import httpStatus from "http-status";
import { db } from "../drizzle/index";
import { redirects } from "../drizzle/schema/redirects";
import { users } from "../drizzle/schema/users";
import { decodeJWT, encodeJWT } from "../utils/JWTRoutes";

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

    // Check if this is a redirect to modalle.digital from redirect.ss-tm.org
    const requestHost = req.headers.host || "";
    if (
      requestHost.includes("redirect.ss-tm.org") &&
      redirectUrl.hostname.includes("modalle.digital")
    ) {
      // Redirect through the modalle redirect service
      const modalleRedirectUrl = `https://redirect.modalle.digital/jwt/${req.params.jwt}`;
      return res.redirect(modalleRedirectUrl);
    }

    // Continue with original redirect logic
    const jwtData = encodeJWT(outData);

    // Extract cookie domain from redirect URL
    const cookieDomain = redirectUrl.hostname.split(".").slice(-2).join(".");

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
            domain: cookieDomain,
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
            domain: cookieDomain,
            sameSite: "lax",
            maxAge: 5 * 60 * 1000, // 5 minutes
          });
        }
      }
    } else {
      res.cookie("x-nfc-auth", jwtData, {
        secure: true,
        sameSite: "lax",
        domain: cookieDomain,
        maxAge: 60 * 1000, // expires in 1 minute (60 seconds)
      });
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

export default router;
