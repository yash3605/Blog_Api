import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// 1. CREATE a new comment
export const createComment = asyncHandler(async (req, res) => {
    const { postId, text } = req.body;

    if (!postId || !text) {
        throw new ApiError(400, "Post ID and comment text are required.");
    }

    const comment = await prisma.comments.create({
        data: {
            post_id: parseInt(postId),
            text,
            user_id: req.user.id,
        },
    });

    return res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
});

// 2. GET all comments for a post
export const getCommentsByPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const comments = await prisma.comments.findMany({
        where: { post_id: parseInt(postId) },
        include: {
            Users: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            }
        },
        orderBy: {
            created_at: "desc"
        }
    });

    return res.status(200).json(new ApiResponse(200, comments, "Comments retrieved successfully"));
});

// 3. UPDATE a comment
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    const existingComment = await prisma.comments.findUnique({
        where: { id: parseInt(commentId) },
    });

    if (!existingComment) {
        throw new ApiError(404, "Comment not found");
    }

    if (existingComment.user_id !== req.user.id) {
        throw new ApiError(403, "You are not allowed to edit this comment");
    }

    const updatedComment = await prisma.comments.update({
        where: { id: parseInt(commentId) },
        data: {
            text,
            updated_at: new Date()
        }
    });

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

// 4. DELETE a comment
export const deleteComment = asyncHandler(async (req, res) => {
    const commentId = parseInt(req.params.id); // ✅ Correct extraction

    if (isNaN(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await prisma.comments.findUnique({
        where: { id: commentId }
    });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.user_id !== req.user.id) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await prisma.comments.delete({
        where: { id: commentId }
    });

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});
