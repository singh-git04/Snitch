import {Router} from "express"
import {validateRegister} from "../validator/auth.validation.js"
import { login, register,googleCallback } from "../controller/auth.controller.js"
import passport from "passport"
import { config } from "../config/config.js"

const authRouter = Router()

authRouter.post("/register",validateRegister,register)

authRouter.post("/login",login)

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


export default authRouter