import express from "express";
import { createComment, deleteComment, updateComment, getCommentsByPost } from "../controllers/comments.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentsRouter = express.Router();

// Public routes
commentsRouter.get("/post/:postId", getCommentsByPost);

// Protected routes
commentsRouter.post("/", verifyJWT, createComment);
commentsRouter.put("/:id", verifyJWT, updateComment);
commentsRouter.delete("/:id", verifyJWT, deleteComment);

export default commentsRouter;
