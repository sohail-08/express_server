
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/user/user.route.ts
import { Router } from "express";

// src/modules/user/user.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(20) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        age INT,
        is_active BOOLEAN DEFAULT TRUE,
        role VARCHAR(10) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS profiles(
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        address TEXT,
        phone VARCHAR(15),
        gender VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
         `);
  } catch (error) {
    console.log(error);
  }
};

// src/modules/user/user.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, age, role } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
    INSERT INTO users(name, email, password, age, role) VALUES($1, $2, $3, $4, COALESCE($5, 'user'))
    RETURNING *
    `, [name, email, hashedPassword, age, role]);
  delete result.rows[0].password;
  return result;
};
var getAllusersFromDB = async () => {
  const result = await pool.query(`
    SELECT * FROM users
    `);
  delete result.rows[0].password;
  return result;
};
var getSingleUserFromDB = async (id) => {
  const result = await pool.query(`
    SELECT * FROM users WHERE id = $1
    `, [id]);
  delete result.rows[0].password;
  return result;
};
var updateUserIntoDB = async (id, payload) => {
  const { name, password, age, is_active } = payload;
  const result = await pool.query(
    `
      UPDATE users SET name = COALESCE($1, name), password = COALESCE($2, password), 
      age = COALESCE($3, age), is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *
      `,
    [name, password, age, is_active, id]
  );
  delete result.rows[0].password;
  return result;
};
var deleteUserFromDB = async (id) => {
  const result = await pool.query(`
    DELETE FROM users WHERE id = $1
    `, [id]);
  return result;
};
var userService = {
  createUserIntoDB,
  getAllusersFromDB,
  getSingleUserFromDB,
  updateUserIntoDB,
  deleteUserFromDB
};

// src/utility/sendResonse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResonse_default = sendResponse;

// src/modules/user/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResonse_default(res, {
      statusCode: 201,
      success: true,
      message: "user created",
      data: result.rows[0]
    });
  } catch (error) {
    sendResonse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllusersFromDB();
    res.status(200).json({
      success: true,
      message: "all users retrieved",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.getSingleUserFromDB(id);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "user not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "user retrieved",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, password, age, is_active } = req.body;
  try {
    const result = await userService.updateUserIntoDB(id, req.body);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "user not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.deleteUserFromDB(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "user not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "user deleted",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      ;
      const decoded = jwt.verify(token, config_default.secret);
      const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [decoded.email]);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "user not found"
        });
      }
      if (!user?.is_active) {
        return res.status(403).json({
          success: false,
          message: "forbidden"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "forbidden"
        });
      }
      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
    ;
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLES = {
  admin: "admin",
  agent: "agent",
  user: "user"
};

// src/modules/user/user.route.ts
var router = Router();
router.post("/", userController.createUser);
router.get("/", auth_default(USER_ROLES.admin, USER_ROLES.agent), userController.getAllUsers);
router.get("/:id", userController.getSingleUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
var userRoute = router;

// src/modules/profile/profile.route.ts
import { Router as Router2 } from "express";

// src/modules/profile/profile.service.ts
var createProfileIntoDB = async (payload) => {
  const { user_id, bio, address, phone, gender } = payload;
  const user = await pool.query(`
    SELECT * FROM users WHERE id = $1
    `, [user_id]);
  if (user.rows.length === 0) {
    throw new Error("user not found");
  }
  const result = await pool.query(`
    INSERT INTO profiles(user_id, bio, address, phone, gender) VALUES($1, $2, $3, $4, $5)
    RETURNING *
    `, [user_id, bio, address, phone, gender]);
  return result;
};
var profileService = {
  createProfileIntoDB
};

// src/modules/profile/profile.controller.ts
var createProfile = async (req, res) => {
  try {
    const result = await profileService.createProfileIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "profile created",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var profileController = {
  createProfile
};

// src/modules/profile/profile.route.ts
var router2 = Router2();
router2.post("/", profileController.createProfile);
var profileRoute = router2;

// src/modules/auth/auth.route.ts
import { Router as Router3 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("invalid credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("invalid credentials");
  }
  const jwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active
  };
  const accessToken = jwt2.sign(jwtPayload, config_default.secret, { expiresIn: "1d" });
  const refreshToken2 = jwt2.sign(jwtPayload, config_default.refresh_secret, { expiresIn: "10d" });
  return { accessToken, refreshToken: refreshToken2 };
};
var generateRefreshToken = async (token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }
  const decoded = jwt2.verify(token, config_default.refresh_secret);
  const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [decoded.email]);
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("user not found");
  }
  if (!user?.is_active) {
    throw new Error("forbidden");
  }
  const jwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active
  };
  const accessToken = jwt2.sign(jwtPayload, config_default.secret, { expiresIn: "1d" });
  return { accessToken };
};
var authService = {
  loginUserIntoDB,
  generateRefreshToken
};

// src/modules/auth/auth.controller.ts
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { refreshToken: refreshToken2 } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: false,
      // set to true in production
      httpOnly: true,
      sameSite: "lax"
    });
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.generateRefreshToken(req.cookies.refreshToken);
    res.status(200).json({
      success: true,
      message: "Access token generated successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  loginUser,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router3 = Router3();
router3.post("/login", authController.loginUser);
router3.post("/refresh-token", authController.refreshToken);
var authRoute = router3;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  const log = `Method -> ${req.method} Time -> ${Date.now()} URL -> ${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger_default);
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173"
}));
app.get("/", (req, res) => {
  res.status(200).json({
    "message": "Express Server",
    "author": "next level"
  });
});
app.use("/api/users", userRoute);
app.use("/api/profiles", profileRoute);
app.use("/api/auth", authRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map