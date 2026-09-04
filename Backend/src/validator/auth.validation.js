import { body , validationResult} from "express-validator"


function validateRequest(req, res, next) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})

        next()
    }
}


export const validateRegister = [
    
    body("email")
    .isEmail().withMessage("Invalid email address"),
    body("password")
    .isLength({min:6}).withMessage("Password must be at least 6 characters long"),
    body("fullname")
    .notEmpty().withMessage("Fullname is required")
    .isLength({min:3}).withMessage("Fullname must be at least 3 characters long"),
    body("contact")
    .notEmpty().withMessage("Contact is required")
    .matches(/^[0-9]{10}$/).withMessage("Contact must be 10 digits long"),
]