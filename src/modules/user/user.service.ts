import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./user.interface";

const createUserIntoDB = async(payload : IUser) => {

    const {name, email, password, age} = payload

    const hashedPassword = await bcrypt.hash(password, 10);
     const result = await pool.query(`
    INSERT INTO users(name, email, password, age) VALUES($1, $2, $3, $4)
    RETURNING *
    `, [name, email, hashedPassword, age]);

    delete result.rows[0].password;
    return result;
};


const getAllusersFromDB = async() =>{

    const result = await pool.query(`
    SELECT * FROM users
    `);
    delete result.rows[0].password;
    return result;

};

const getSingleUserFromDB = async(id : string) =>{
    const result = await pool.query(`
    SELECT * FROM users WHERE id = $1
    `, [id]);
    delete result.rows[0].password;
    return result;
}

const updateUserIntoDB =    async(id : string, payload : IUser) =>{

    const {name, password, age, is_active} = payload;
     const result = await pool.query(
      `
      UPDATE users SET name = COALESCE($1, name), password = COALESCE($2, password), 
      age = COALESCE($3, age), is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *
      `,[name, password, age, is_active, id]
    );
    delete result.rows[0].password;
    return result;
}

const deleteUserFromDB = async(id : string) =>{
    const result = await pool.query(`
    DELETE FROM users WHERE id = $1
    `, [id]);
    return result;
    }

export const userService = {
    createUserIntoDB,
    getAllusersFromDB,
    getSingleUserFromDB,
    updateUserIntoDB,
    deleteUserFromDB
}