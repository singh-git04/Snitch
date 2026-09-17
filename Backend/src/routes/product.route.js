import { Router } from 'express'
import { authenticateSeller } from '../middleware/authenticateSeller.js'
import multer from 'multer'
import { addProductVariant, createProduct, getAllProducts, getProductById, getSellerProducts, deleteProductVariant } from '../controller/product.controller.js'
import { createProductValidator } from "../validator/product.validation.js"


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5mb
    }
})


const router = Router()

/* 
    @route POST /api/products
    @description Create new product
    @access Private (Seller only)
*/
router.post('/', authenticateSeller, upload.array('images', 7), createProductValidator, createProduct)

/* 
    @route Get /api/products/seller
    @description Get details  of authenticated product
    @access Private (Seller only)
*/

router.get('/seller', authenticateSeller, getSellerProducts)

/* 
    @route Get /api/products/seller
    @description Get all products
    @access Public
*/

router.get('/', getAllProducts)

/* 
    @route Get /api/products/:id
    @description Get product
    @access Public
*/
router.get('/detail/:id', getProductById)


/*
    @route POST /api/products/:productId/variants
    @description Add a new variant to a product
    @access Private (Seller only)
 */
router.post("/:productId/variants", authenticateSeller, upload.array('images', 7), addProductVariant)

/*
    @route PUT /api/products/:productId/variants/:variantId
    @description Update an existing product variant
    @access Private (Seller only)
 */
router.put("/:productId/variants/:variantId", authenticateSeller, upload.array('images', 7),addProductVariant)

/*
    @route DELETE /api/products/:productId/variants/:variantId
    @description Delete a product variant
    @access Private (Seller only)
 */
router.delete("/:productId/variants/:variantId", authenticateSeller, deleteProductVariant)

export default router