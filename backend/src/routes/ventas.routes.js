import {Router} from 'express';
const router = Router();
import {ventasController} from "../controllers/ventas.controller.js";

router.post("/ventas/web", ventasController.registrarWeb);
router.post("/ventas/manual", ventasController.registrarManual);
router.get("/ventas", ventasController.listarTodo);
router.put("/ventas/confirmar/:id", ventasController.confirmar);
router.put("/ventas/anular/:id", ventasController.anular);

export default router;
