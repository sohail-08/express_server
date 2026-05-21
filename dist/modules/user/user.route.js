import { Router } from "express";
import { pool } from "../../db";
const router = Router();
router.post('/', async (req, res) => {
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
export const userRoute = router;
//# sourceMappingURL=user.route.js.map