import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array();
  return res.status(400).json({
    message: errors.map((e) => e.msg).join(". "),
    errors,
  });
};