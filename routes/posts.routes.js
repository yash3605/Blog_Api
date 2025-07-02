import express from "express";
import { createPost, getAllPublishedPost, getPostById, updatePost, deletePost } from "../controllers/posts.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const postsRouter = express.Router();

// Public routes
postsRouter.get("/", getAllPublishedPost);
postsRouter.get("/:id",verifyJWT, getPostById);

// Protected routes
postsRouter.post("/", verifyJWT, createPost);
postsRouter.put("/:id", verifyJWT, updatePost);
postsRouter.delete("/:id", verifyJWT, deletePost);

export default postsRouter;
