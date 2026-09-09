import {Router} from 'express'
import { authenticateSeller } from '../middleware/authenticateSeller.js'
import multer from 'multer'



const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5mb
    }   
})


const router = Router()


router.post('/',authenticateSeller, upload.array('images', 7), )


export default router