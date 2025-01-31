import express from "express";
import { authenticateJWT } from "../middlewares/jwtAuth";

const modalleRoute = express.Router();

modalleRoute.get("/tokengate", authenticateJWT, async (req, res) => {
  const jwt = req.jwt;
  console.log(jwt);
  res.json({ message: "Welcome to the token gate" });
});

export default modalleRoute;
