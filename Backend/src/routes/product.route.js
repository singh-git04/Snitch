import {Router} from 'express'
import { authenticateSeller } from '../middleware/authenticateSeller.js'
import multer from 'multer'
import { createProduct, getSellerProducts } from '../controller/product.controller.js'



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
    @acess Private (Seller only)
*/
router.post('/',authenticateSeller, upload.array('images', 7),createProduct )

/* 
    @route Get /api/products/seller
    @description Get details  of authenticated product
    @acess Private (Seller only)
*/

router.get('/seller',authenticateSeller,getSellerProducts)


export default router