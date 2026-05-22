import bcrypt from "bcryptjs";
import { pool } from "../../db";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const loginUserIntoDB = async(payload: { email: string; password: string }) =>{
    const {email, password} = payload;
    const userData = await pool.query(`
    SELECT * FROM users WHERE email = $1
    `, [email]);
        if (userData.rows.length === 0) {
        throw new Error("invalid credentials");
    }
    const user = userData.rows[0];
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
        throw new Error("invalid credentials");
    }
    const jwtPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active
    }

    const accessToken = jwt.sign(jwtPayload, config.secret as string, { expiresIn: "1d" });
    
    const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, { expiresIn: "10d" });

    return {accessToken, refreshToken};
}

const generateRefreshToken = async(token : string) => {
    if(!token){
        throw new Error("Unauthorized");
    }

    const decoded = jwt.verify(token as string, config.refresh_secret as string) as JwtPayload;

    const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [decoded.email]);

    const user = userData.rows[0];
    if(userData.rows.length === 0){
        throw new Error("user not found");
    }

    if(!user?.is_active){
        throw new Error("forbidden");
    }

    const jwtPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active
    }

    const accessToken = jwt.sign(jwtPayload, config.secret as string, { expiresIn: "1d" });

    return {accessToken};
}
export const authService = {
    loginUserIntoDB, generateRefreshToken
}