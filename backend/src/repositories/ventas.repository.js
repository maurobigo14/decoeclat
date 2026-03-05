import {pool} from "../config/db.js";

export const ventasRepository = {

    async CreateVenta(ventaData, items) { // 1. Cambiamos 'venta' por 'ventaData'
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ventaQuery = `
            INSERT INTO ventas (total, metodo_pago, cliente_id, estado_id)
            VALUES ($1, $2, $3, $4)
            RETURNING venta_id;
        `;

        const valuesVenta = [
            ventaData.total,
            ventaData.metodo_pago,
            ventaData.cliente_id,
            1 // Sigue siendo 1 para Pendiente, ¡esto está bien!
        ];

        const { rows: ventaRows } = await client.query(ventaQuery, valuesVenta);
        const idGenerado = ventaRows[0].venta_id;

        const detalleQuery = `
            INSERT INTO detalle_ventas (cantidad, precio_unitario, venta_id, variante_id)
            VALUES ($1, $2, $3, $4)
        `;

        for (const item of items) {
            const valuesDetalle = [
                item.cantidad,
                item.precio_unitario,
                idGenerado,
                item.variante_id
            ];
            await client.query(detalleQuery, valuesDetalle);
        }

        await client.query('COMMIT');
        
        // Devolvemos el objeto limpio
        return { id: idGenerado, ...ventaData, items };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en CreateVenta Repository:", error); // Un log para ayudarte
        throw error;
    } finally {
        client.release();
    }
},
    async createVentaDirecta(ventaData, items) {
        const client=await pool.connect();
        try {
            await client.query('BEGIN');

            const ventaQuery = `
            INSERT INTO ventas (total, metodo_pago, cliente_id, estado_id)
            VALUES ($1, $2, $3, $4)
            RETURNING venta_id;
            `;
            const {rows: ventaRows} = await client.query(ventaQuery, [
                ventaData.total,
                ventaData.metodo_pago,
                ventaData.cliente_id,
                2
            ]);
            const idGenerado = ventaRows[0].venta_id;

            for (const item of items) {
                const detalleQuery = `
                INSERT INTO detalle_ventas (cantidad, precio_unitario, venta_id, variante_id)
                VALUES ($1, $2, $3, $4)
                `;
                await client.query(detalleQuery, [
                    item.cantidad,
                    item.precio_unitario,
                    idGenerado,
                    item.variante_id
                ]);

                const updateStockQuery = `
                UPDATE variantes_producto
                SET stock = stock - $1
                WHERE variante_id = $2 AND stock >= $1
                RETURNING stock
                `;

                const stockRes= await client.query(updateStockQuery, [item.cantidad, item.variante_id]);

                if (stockRes.rowCount === 0) {
                    throw new Error(`Stock insuficiente para variante_id ${item.variante_id}`);
                }

            }

            await client.query('COMMIT');
            return {id: idGenerado, ...ventaData, items, estado: 'confirmada'};
        }catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }finally {
            client.release();
        }
    },


    async findAll(){
        const query = `
        SELECT v.*, c.nombre AS cliente_nombre, e.descripcion AS estado_nombre
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        ORDER BY v.created_at DESC
        `;
        const {rows} = await pool.query(query);
        return rows;
    },

    async findById(id) {
        const query = `
        SELECT v.*, c.nombre AS cliente_nombre, e.descripcion AS estado_nombre
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        WHERE v.venta_id = $1
        `;
        const {rows} = await pool.query(query, [id]);
        return rows[0];
    },

    async confirmarVenta(ventaId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const detalles = await client.query(`
                SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = $1
            `, [ventaId]);

            for (const item of detalles.rows) {
                const updateStock = `
                    UPDATE variantes_producto
                    SET stock = stock - $1
                    WHERE variante_id = $2 AND stock >= $1
                    RETURNING stock
                `;
                const res = await client.query(updateStock, [item.cantidad, item.variante_id]);

                if (res.rowCount === 0) {
                    throw new Error(`Stock insuficiente para variante_id ${item.variante_id}`);
                }
            }

            await client.query(`
                UPDATE ventas
                SET estado_id = 2
                WHERE venta_id = $1
            `, [ventaId]);

            await client.query('COMMIT');
            return {success: true} ;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        },

    async anularVenta(ventaId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const detalles = await client.query(`
                SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = $1
            `, [ventaId]);

            for (const item of detalles.rows) {
                await client.query(`
                    UPDATE variantes_producto
                    SET stock = stock + $1
                    WHERE variante_id = $2
                `, [item.cantidad, item.variante_id]);
            }

            await client.query(`
                UPDATE ventas
                SET estado_id = 4
                WHERE venta_id = $1
            `, [ventaId]);

            await client.query('COMMIT');
            return {success: true};
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};