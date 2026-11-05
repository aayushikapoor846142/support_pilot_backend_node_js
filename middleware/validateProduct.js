import { body, validationResult } from "express-validator";

export const productRules = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Product name is required"),

    body("price")
        .isFloat({ min: 0 })
        .withMessage("Price must be a non-negative number"),

    body("category")
        .trim()
        .notEmpty()
        .withMessage("Category is required")
];

export function checkValidation(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }))
        });
    }

    next();
}