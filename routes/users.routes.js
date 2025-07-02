import express from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, refreshAccessToken } from "../controllers/users.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const usersRouter = express.Router();

usersRouter.post("/register", registerUser);
usersRouter.post("/login", loginUser);
usersRouter.post("/logout", logoutUser);
usersRouter.get("/profile", verifyJWT, getCurrentUser);
usersRouter.get("/refresh-token", refreshAccessToken);

export default usersRouter;
