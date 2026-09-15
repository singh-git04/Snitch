import {Router} from "express"
import {validateRegister} from "../validator/auth.validation.js"
import { login, register,googleCallback, getMe } from "../controller/auth.controller.js"
import passport from "passport"
import { config } from "../config/config.js"
import { authenticateUser } from "../middleware/authenticateSeller.js"

const authRouter = Router()


/*  
    @route Post/api/auth/register
    @description register
    @acess Public
*/
authRouter.post("/register",validateRegister,register)


/*  
    @route Post/api/auth/login
    @description login
    @acess Private
*/
authRouter.post("/login",login)


/* 
    /auth/google
*/
authRouter.get("/google",
    passport.authenticate("google", {scope: ["profile","email"]})
)

authRouter.get("/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: config.NODE_ENV == "development" ? "http://localhost:5173/login" : "/login"
    }),
    googleCallback,
)

/*  
    @route Get/api/auth/me
    @description Get the authenticated user's profile
    @acess Private
*/
authRouter.get('/me',authenticateUser, getMe)

export default authRouter