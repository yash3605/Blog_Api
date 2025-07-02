import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();


export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log("Token:", token)

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        req.user = {
            id: decodedToken.id
        }

        const user = await prisma.users.findUnique({
            where: { id: decodedToken.id },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }


        console.log("✅ verifyJWT triggered for:", req.method, req.originalUrl);
        console.log("Token:", token);
        console.log("Decoded Token:", decodedToken);
        console.log("User from DB:", user);
        req.user = user;
        next();
    } catch (err) {
        throw new ApiError(401, err?.message || "Invalid access token");
    }
});

