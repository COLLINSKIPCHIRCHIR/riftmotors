import { body } from "express-validator";

export const validatePurchase = [
  body("supplier_id")
    .isInt({ min: 1 })
    .withMessage("Valid supplier ID is required"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.sparepart_id")
    .isInt({ min: 1 })
    .withMessage("Valid spare part ID required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("items.*.unit_cost")
    .isFloat({ min: 0 })
    .withMessage("Unit cost must be positive"),
];