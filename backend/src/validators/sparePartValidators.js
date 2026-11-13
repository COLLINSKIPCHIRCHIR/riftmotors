import { body } from "express-validator";

const common = [
  body("name")
    .trim()
    .notEmpty().withMessage("Part name is required")
    .isLength({ max: 150 }).withMessage("Part name must be 150 characters or fewer"),

  body("part_number")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 }).withMessage("Part number must be 100 characters or fewer"),

  body("quantity")
    .notEmpty().withMessage("Quantity is required")
    .bail()
    .isFloat({ min: 0 }).withMessage("Quantity must be a number, 0 or more"),

  body("buying_price")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 }).withMessage("Buying price must be a number, 0 or more"),

  body("selling_price")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 }).withMessage("Selling price must be a number, 0 or more"),

  body("discount")
    .optional({ values: "falsy" })
    .isFloat({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),
];

// New parts must have a part number
export const validateSparePart = [
  body("part_number").trim().notEmpty().withMessage("Part number is required"),
  ...common,
];

// Edits: old records may have no part number, so don't block the save
export const validateSparePartUpdate = common;