import { body } from "express-validator";

export const validatePurchase = [
  body("supplier_id")
    .isInt({ min: 1 })
    .withMessage("Valid supplier ID is required"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("items.*.unit_cost")
    .isFloat({ min: 0 })
    .withMessage("Unit cost must be positive"),

  // Optional — createPurchaseTransaction/updatePurchaseTransaction both
  // default to 16 when this is omitted, so it's not required here.
  body("tax_rate")
    .optional({ checkFalsy: false, nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("Tax rate must be between 0 and 100"),

  // Each line is either an existing part (sparepart_id) or a brand-new
  // one (new_part.name) — never both, never neither.
  body("items").custom((items) => {
    items.forEach((item, index) => {
      const hasExisting = item.sparepart_id !== undefined && item.sparepart_id !== null && item.sparepart_id !== "";
      const hasNew = !!item.new_part?.name;

      if (!hasExisting && !hasNew) {
        throw new Error(`Item ${index + 1}: select an existing part or enter a new part name`);
      }
      if (hasExisting && hasNew) {
        throw new Error(`Item ${index + 1}: choose either an existing part or a new part, not both`);
      }
    });
    return true;
  }),
];