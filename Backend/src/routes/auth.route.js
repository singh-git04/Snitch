import {Router} from "express"
import {validateRegister} from "../validator/auth.validation.js"
import { register } from "../controller/auth.controller.js"


const authRouter = Router()

authRouter.post("/register",validateRegister,register)


export default authRouter