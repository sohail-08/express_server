import express, {} from "express";
import { Pool } from "pg";
import config from "./config";
const app = express();
const port = config.port;
const pool = new Pool({
    connectionString: config.connection_string
});
app.use(express.json());
const initDB = async () => {
    try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(20) NOT NULL,
        age INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
        console.log("Table created successfully");
    }
    catch (error) {
        console.log(error);
    }
};
initDB();
app.get('/', (req, res) => {
    res.status(200).json({
        "message": "Express Server",
        "author": "next level",
    });
});
app.post('/api/users', async (req, res) => {
    const { name, email, password, age } = req.body;
    try {
        const result = await pool.query(`
    INSERT INTO users(name, email, password, age) VALUES($1, $2, $3, $4)
    RETURNING *
    `, [name, email, password, age]);
        // console.log(result);
        // console.log(req.body);
        res.status(201).json({
            success: true,
            message: "user created",
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
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=server.js.map