import {Router} from 'express'
import { authenticateSeller } from '../middleware/authenticateSeller.js'
import multer from 'multer'
import { createProduct, getAllProducts, getProductById, getSellerProducts } from '../controller/product.controller.js'
import {createProductValidator} from "../validator/product.validation.js"


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
router.post('/',authenticateSeller, upload.array('images', 7),createProductValidator,createProduct )

/* 
    @route Get /api/products/seller
    @description Get details  of authenticated product
    @access Private (Seller only)
*/

router.get('/seller',authenticateSeller,getSellerProducts)

/* 
    @route Get /api/products/seller
    @description Get all products
    @access Public
*/

router.get('/',getAllProducts)

/* 
    @route Get /api/products/:id
    @description Get product
    @access Public
*/
router.get('/detail/:id',getProductById)



export default router