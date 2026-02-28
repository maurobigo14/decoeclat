import { pool } from "../config/db.js";

export const variantesRepository = {
    async create({ productoId, colorId, talleId, stock }) {
        const text = `
            INSERT INTO variantes_producto (producto_id, color_id, talle_id, stock)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [productoId, colorId, talleId, stock];
        const { rows } = await pool.query(text, values);
        return rows[0];
    }
};