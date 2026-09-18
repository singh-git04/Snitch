import { Router } from "express"
import { authenticateUser } from "../middleware/authenticateSeller"
import { validateAddToCart } from "../validator/cart.validation"
import { addToCart, getCart } from "../controller/cart.controller"

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

export default router