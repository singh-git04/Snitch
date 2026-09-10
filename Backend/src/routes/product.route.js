import {Router} from 'express'
import { authenticateSeller } from '../middleware/authenticateSeller.js'
import multer from 'multer'
import { createProduct } from '../controller/product.controller.js'



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


export default router