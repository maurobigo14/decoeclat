import { productosRepository } from "../repositories/productos.repository.js";

/**
 * Service layer contains business logic and input validation.
 * It delegates data access to the repository layer.
 */

export const productosService = {
  async registerProduct(data) {
    // Basic validation – for our existing database we expect
    // { name, categoryId, price } are required. Optional fields:
    // description, offerPrice, onOffer. Controller may normalize types.
    const required = ["name", "categoryId", "price"];
    for (const field of required) {
      if (data[field] == null) {
        throw new Error(`${field} is required`);
      }
    }

    const payload = {
      name: data.name,
      categoryId: data.categoryId,
      price: data.price,
      description: data.description ?? null,
      offerPrice: data.offerPrice ?? null,
      onOffer: data.onOffer == null ? false : data.onOffer,
    };

    return productosRepository.create(payload);
  },

  async getProducts(filters) {
    // filters may contain name or categoryId
    return productosRepository.find(filters);
  },

  async getProduct(id) {
    return productosRepository.findById(id);
  },

  async modifyProduct(id, updates) {
    // Only allow known updatable fields to be sent to repository
    const allowed = [
      "name",
      "description",
      "price",
      "offerPrice",
      "onOffer",
      "categoryId",
    ];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) {
        payload[k] = updates[k];
      }
    }
    if (Object.keys(payload).length === 0) return null;
    return productosRepository.update(id, payload);
  },

  async removeProduct(id) {
    // logical deletion/inactivation
    return productosRepository.deactivate(id);
  },
};
