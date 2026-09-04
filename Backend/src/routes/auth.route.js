import {Router} from "express"
import {validateRegister} from "../validator/auth.validation.js"


const authRouter = Router()

authRouter.post("/register",validateRegister )


export default authRouter