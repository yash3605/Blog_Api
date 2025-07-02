import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PrismaClient } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

const prisma = new PrismaClient();

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("ERROR: ", error);
    throw new ApiError(500, "Failed to generate tokens");
  }
};

// POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await prisma.users.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, user, "User created successfully"));
});

// POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.users.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id
  );

  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
      path: '/'
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    .json(
      new ApiResponse(
        200,
        {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
          },
        },
        "Login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("Before clear:", req.cookies);

  res.clearCookie("accessToken", {
    path: "/", // Ensure same path used during setting
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.clearCookie("refreshToken", {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  console.log("After clear:", req.cookies); // ✅ This is safe

  return res.json(new ApiResponse(200, {}, "User logged out"));
});
// GET /api/users/profile
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  });

  res.status(200).json(new ApiResponse(200, user, "User profile fetched"));
});

// GET /api/users/refresh-token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(decoded.id);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json(new ApiResponse(200, { accessToken }, "Token refreshed"));
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

export {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
};
