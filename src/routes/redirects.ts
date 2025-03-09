import { eq } from "drizzle-orm";
import express from "express";
import httpStatus from "http-status";
import { db } from "../drizzle/index";
import { redirects } from "../drizzle/schema/redirects";
import { projects } from "../drizzle/schema/projects";
import { authenticateJWT } from "../middlewares/jwtAuth";
import { encodeJWT } from "../utils/JWTRoutes";

const router = express.Router();

router.get("/", authenticateJWT, async (req, res) => {
  try {
    // join projects table based on projectId
    const results = await db
      .select({ redirect: redirects, project: projects })
      .from(redirects)
      .leftJoin(projects, eq(redirects.projectId, projects.id))
      .orderBy(redirects.createdAt);

    const BASE_HOST = `https://${req.get("host")}`;
    const buildLink = (jwt: Record<string, any>) =>
      `${BASE_HOST}/jwt/${encodeJWT({ uuid: jwt.uuid })}`;
    const resultsWithLinks = results.map(({ redirect, project }) => ({
      ...redirect,
      project,
      link: buildLink(redirect),
    }));
    res.status(httpStatus.OK).json(resultsWithLinks);
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
    });
  }
});

router.post("/", authenticateJWT, async (req, res) => {
  try {
    const redirectsData = req.body;

    if (!Array.isArray(redirectsData) || redirectsData.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Invalid input data",
        data: null,
      });
    }

    const result = await db.insert(redirects).values(redirectsData).returning();
    const BASE_HOST = `https://${req.get("host")}`;
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

router.put("/:uuid", authenticateJWT, async (req, res) => {
  try {
    const { uuid } = req.params;
    const updateData = req.body;
    console.log("Updating redirect", { uuid, updateData });

    const [result] = await db
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
