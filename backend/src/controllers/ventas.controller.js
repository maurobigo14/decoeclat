import { ventasService } from "../services/ventas.service.js";

export const ventasController = {
    async registrarWeb(req, res) {
        try {
            const nuevaVenta= await ventasService.registrarPedidoWeb(req.body);
            res.status(201).json({mensage: "Pedido web registrado con exito (Pendiente de confirmacion)",
                data: nuevaVenta});
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async registrarManual(req, res) {
        try {
            const nuevaVenta = await ventasService.registrarVentaManual(req.body);
            res.status(201).json({
                message: "Venta manual registrada y stock actualizado",
                data: nuevaVenta
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    //El botón de "Confirmar" que aprieta el dueño 
    async confirmar(req, res) {
        try {
            const {id} = req.params;
            const resultado =await ventasService.confirmarPedidoPendiente(id);
            res.status(200).json({message: "Venta confirmada con exito", resultado});
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async anular(req, res) {
        try {
            const {id} = req.params;
            const resultado = await ventasService.anularVentaRealizada(id);
            res.status(200).json({message: "Venta anulada con exito y stock reintegrado", resultado});
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async listarTodo(req, res) {
        try {
            const ventas = await ventasService.obtenerHistorial();
            res.status(200).json({ventas});
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    },


};