import { productosService } from "../services/productos.service.js";

/**
 * Controller handlers translate HTTP-level details to service calls and
 * format the responses.
 */

export const productosController = {
  async create(req, res) {
    try {
      // expect at minimum { name, categoryId, price }
      // optional: description, offerPrice, onOffer
      const body = req.body || {};
      const payload = {
        name: body.name,
        categoryId: body.categoryId,
        price: Number(body.price),
        description: body.description,
        offerPrice: body.offerPrice == null ? null : Number(body.offerPrice),
        onOffer:
          body.onOffer === true || body.onOffer === 'true' || body.onOffer === 1 || body.onOffer === '1',
      };
      const product = await productosService.registerProduct(payload);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async list(req, res) {
    const filters = {
      name: req.query.name,
      categoryId: req.query.categoryId,
    };
    const products = await productosService.getProducts(filters);
    res.json(products);
  },

  async get(req, res) {
    const prod = await productosService.getProduct(req.params.id);
    if (!prod) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(prod);
  },

async update(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      
      const updates = {};

      // Mapeamos EXACTAMENTE lo que mandaste en tu JSON de Postman
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.price !== undefined) updates.price = Number(body.price);
      if (body.offerPrice !== undefined) updates.offerPrice = Number(body.offerPrice);
      
      // Manejo del booleano onOffer
      if (body.onOffer !== undefined) {
        updates.onOffer = body.onOffer === true || body.onOffer === 'true' || body.onOffer === 1;
      }
      
      if (body.categoryId !== undefined) updates.categoryId = body.categoryId;

      // Log para que veas en la consola si se están cargando los datos
      console.log("Campos a actualizar:", updates);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No se enviaron campos válidos para actualizar. Revisa los nombres en el JSON." });
      }

      const updated = await productosService.modifyProduct(id, updates);
      
      if (!updated) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    const removed = await productosService.removeProduct(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "Product not found" });
    }
    // 204 No Content when successful
    res.status(204).send();
  },
};
