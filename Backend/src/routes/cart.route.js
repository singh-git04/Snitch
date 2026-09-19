import { Router } from "express"
import { authenticateUser } from "../middleware/authenticateSeller.js"
import { validateAddToCart, validateIncrementCartItemQuantity } from "../validator/cart.validation.js"
import { addToCart, getCart, incrementCartItemQuantity } from "../controller/cart.controller.js"

 const router = Router()


/* 
    @route Post/api/cart/add/:productId/:variantId
    @desc Add item to the cart
    @access Private
    @argument productId - ID of the product to add
    @argument variantId - ID of the varinat to add
    @argument quantity - Quantity of the item to add {optional, default:1}
*/
router.post("/add/:productId/:variantId",authenticateUser,validateAddToCart,addToCart)


/* 
    @route Get/api/cart
    @desc Get user's cart
    @access Private
*/
router.get("/", authenticateUser, getCart)

/* 
    @route Patch /api/cart/quantity/increment/:productId/:variantId
    @desc Increament item quantity in cart by one
    @access Private
    @argument productId - ID of the product  to update
    @argument varinatId - ID of the variant to update
*/
router.patch("/quantity/increment/:productId/:variantId", authenticateUser, validateIncrementCartItemQuantity, incrementCartItemQuantity)

export default router