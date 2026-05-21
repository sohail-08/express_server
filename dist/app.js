import express, {} from "express";
import { pool } from "./db";
import { userRoute } from "./modules/user/user.route";
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).json({
        "message": "Express Server",
        "author": "next level",
    });
});
app.use('api/users', userRoute);
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM users
      `);
        res.status(200).json({
            success: true,
            message: "all users retrieved",
            data: result.rows
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
});
app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
    SELECT * FROM users WHERE id = $1
    `, [id]);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
});
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, password, age, is_active } = req.body;
    try {
        const result = await pool.query(`
      UPDATE users SET name = COALESCE($1, name), password = COALESCE($2, password), 
      age = COALESCE($3, age), is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *
      `, [name, password, age, is_active, id]);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
});
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
    DELETE FROM users WHERE id = $1
    `, [id]);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
});
export default app;
//# sourceMappingURL=app.js.map