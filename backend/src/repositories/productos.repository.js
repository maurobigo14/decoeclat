import { pool } from "../config/db.js";

/**
 * Repository layer handles direct database operations for products.
 * SQL queries are executed with parameter binding to avoid injections.
 */

export const productosRepository = {
  async create({ name, categoryId, price, description, offerPrice, onOffer }) {
    const text = `
      INSERT INTO productos (nombre, descripcion, precio, precio_oferta, en_oferta, categoria_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      name,
      description ?? null,
      price,
      offerPrice ?? null,
      onOffer == null ? false : onOffer,
      categoryId,
    ];
    const { rows } = await pool.query(text, values);
    return rows[0];
  },

  async find(filters = {}) {
    let query = `
      SELECT p.*, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.categoria_id = p.categoria_id
      WHERE p.activo = true
    `;
    const values = [];
    let idx = 1;

    if (filters.name) {
      query += ` AND p.nombre ILIKE $${idx}`;
      values.push(`%${filters.name}%`);
      idx++;
    }
    if (filters.categoryId) {
      query += ` AND p.categoria_id = $${idx}`;
      values.push(filters.categoryId);
      idx++;
    }

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      "SELECT * FROM productos WHERE producto_id = $1",
      [id]
    );
    return rows[0];
  },

async update(id, fields = {}) {
    const sets = [];
    const values = [];
    let idx = 1;

    // Mapeo para que si mandas 'name' desde el service, se guarde como 'nombre' en SQL
    const columnMap = {
      name: "nombre",
      price: "precio",
      categoryId: "categoria_id",
      description: "descripcion",
      offerPrice: "precio_oferta",
      onOffer: "en_oferta",
    };

    for (const key of Object.keys(fields)) {
      const col = columnMap[key] || key;
      sets.push(`${col} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }

    if (sets.length === 0) return null;

    // Agregamos el ID al final del array de valores
    values.push(id);
    
    // IMPORTANTE: Quitamos updated_at para evitar errores de SQL
    const text = `
      UPDATE productos
      SET ${sets.join(", ")}
      WHERE producto_id = $${idx}
      RETURNING *
    `;

    const { rows } = await pool.query(text, values);
    return rows[0];
  },

  async deactivate(id) {
    const { rows } = await pool.query(
      "UPDATE productos SET activo = false WHERE producto_id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  },
};
