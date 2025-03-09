import express from "express";
import "express-async-errors";
import "dotenv/config";

import basicRoutes from "./basic";
import authRoutes from "./auth";
import redirectRoutes from "./redirects";
import nftRoutes from "./nft";
import userRoutes from "./users";
import userRouter from "./user";
import modalleRoute from "./modalle";

const router = express.Router();

// Mount all the route modules
router.use("/", basicRoutes);
router.use("/auth", authRoutes);
router.use("/redirects", redirectRoutes);
router.use("/", nftRoutes);
router.use("/user", userRouter);
router.use("/modalle", modalleRoute);

// Add user routes (new file for /user/:username, /user/nfc/:uuid, etc)
router.use("/user", userRoutes);

export default router;
