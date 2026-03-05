import { ventasRepository } from "../repositories/ventas.repository.js";

export const ventasService = {
    async registrarPedidoWeb(datosVenta) {

        const { cliente_id, metodo_pago, items } = datosVenta;

        if (!items|| items.length === 0) {
            throw new Error("El pedido debe contener al menos un item");
        }

        const montoTotal = items.reduce((acumulado, item) => { 
            const subtotal = item.cantidad * item.precio_unitario;
            return acumulado + subtotal;
        }, 0);

        const nuevaVentaData= {
            cliente_id,
            metodo_pago,
            total: montoTotal
        };

        return await ventasRepository.createVentaDirecta(nuevaVentaData, items);
    },

    async registrarVentaManual(datosVenta) {
        const { cliente_id, metodo_pago, items } = datosVenta;

        if (!cliente_id) throw new Error("El cliente_id es requerido");
        if (!items || items.length === 0) throw new Error("La venta debe contener al menos un item");

        const montoTotal = items.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);

        const ventaData ={
            cliente_id,
            metodo_pago,
            total: montoTotal
        }

        return await ventasRepository.createVentaDirecta(ventaData, items);
    },

 async confirmarPedidoPendiente(ventaId) {
    if (!ventaId) throw new Error("El venta_id es requerido");

    const venta = await ventasRepository.findById(ventaId);

    // DEBUG: Vamos a ver qué trae de la base de datos
    console.log("Datos de la venta encontrada:", venta);

    if (!venta) {
        throw new Error("Venta no encontrada");
    }

    // Usamos Number() por las dudas de que la DB devuelva un string
    if (Number(venta.estado_id) !== 1) {
        throw new Error(`La venta está en estado ${venta.estado_id}, no en 1 (pendiente)`);
    }

    // CORRECCIÓN AQUÍ: Usar 'ventaId', no 'venta_id'
    return await ventasRepository.confirmarVenta(ventaId); 
},

    async anularVentaRealizada(ventaId) {

        const venta = await ventasRepository.findById(ventaId);

        if (!venta) {throw new Error("Venta no encontrada");}

        if (venta.estado_id !== 2) {
            throw new Error("Solo las ventas confirmadas pueden ser anuladas");
        }

        return await ventasRepository.anularVenta(ventaId);
    },

    async obtenerHistorial(){
        return await ventasRepository.findAll();
    },

    async obtenerDetalleVenta(id) {
        const venta=await ventasRepository.findById(id);

        if (!venta) {
            throw new Error("Venta no encontrada");
        }
        return venta;
    },










}