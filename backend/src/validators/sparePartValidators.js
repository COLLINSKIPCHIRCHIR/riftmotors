import { body } from "express-validator";

export const validateSparePart = [
  body("name").notEmpty().withMessage("Part name is required"),
  body("part_number").notEmpty().withMessage("Part number is required"),
  body("buying_price")
    .isNumeric().withMessage("Buying price must be a number")
    .isFloat({ min: 0 }).withMessage("Buying price must be positive"),
  body("selling_price")
    .isNumeric().withMessage("Selling price must be a number")
    .isFloat({ min: 0 }).withMessage("Selling price must be positive"),
  body("quantity")
    .isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
];