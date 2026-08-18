import { body } from "express-validator";

export const validateReceipt = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one received item is required"),
  body("items.*.purchase_item_id")
    .isInt({ min: 1 })
    .withMessage("Valid purchase item ID required"),
  body("items.*.quantity_received")
    .isInt({ min: 1 })
    .withMessage("Received quantity must be at least 1"),
  body("notes").optional().isString(),
];