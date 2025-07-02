import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const createPost = asyncHandler( async(req, res) => {
    const { title, blog, published = false} = req.body;

    if(!title) {
        throw new ApiError(400, "Title is required");
    }

    const post = await prisma.posts.create({
        data: {
            title,
            blog,
            published,
            user_id: req.user.id,
        },
    })

    res.status(201).json(new ApiResponse(201, "Post created Successfully", post));
})

const getAllPublishedPost = asyncHandler( async(req, res) => {
    const posts = await prisma.posts.findMany({
        where: { published: true },
        include: {
            Users: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                }
            }
        },
        orderBy: {
            created_at: "desc"
        }
    })
    res.status(201).json(new ApiResponse(201, "Posts fetched successfully", posts))
})

const getPostById = asyncHandler( async(req, res) => {
    console.log("req.user inside getPostById:", req.user);
    const postId = parseInt(req.params.id);


    const post = await prisma.posts.findUnique({
        where: { id: postId },
        include: {
            Users: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                }
            }
        }
    })

    if(!post){
        throw new ApiError(404, "Post not found");
    }

    const isOwner = post.user_id === req.user?.id;

    if(!post.published && !isOwner) {
        throw new ApiError(403, "Not Authorized to view this Post");
    }

    res.status(200).json(new ApiResponse(200, "Post retrieved", post));
})

const updatePost = asyncHandler( async(req, res) => {
    const postId = parseInt(req.params.id);
    const { title, blog, published } = req.body;

    const post = await prisma.posts.findUnique({ where: { id: postId } });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.user_id !== req.user.id) {
        throw new ApiError(403, "You are not authorized to update this post");
    }

    const updated = await prisma.posts.update({
        where: { id: postId },
        data: {
            title: title ?? post.title,
            blog: blog ?? post.blog,
            published: published ?? post.published,
            updated_at: new Date(),
        },
    });

    res.status(200).json(new ApiResponse(200, updated, "Post updated"));
})

const deletePost = asyncHandler(async (req, res) => {
  const postId = parseInt(req.params.id);

  const post = await prisma.posts.findUnique({ where: { id: postId } });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.user_id !== req.user.id) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  await prisma.posts.delete({ where: { id: postId } });

    console.log("✅ deletePost called. req.user:", req.user);

  res.status(200).json(new ApiResponse(200, null, "Post deleted"));
});

export { createPost, getAllPublishedPost, getPostById, updatePost, deletePost }
