import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import userModel from '../model/user.model.js'

export const authenticateUser = async(req,res,next) =>{
    const token = req.cookies.token

    if(!token){
        return res.status(401).json({message: 'Unauthorized'})
    }

    try{
        const decoded = jwt.verify(token, config.JWT_SECRET)

        const user = await userModel.findById(decoded.id)

        if(!user){
            return res.status(401).json({message: 'Unauthorized'})
        }

        req.user = user

        next()
    }catch(error){
        console.log(error.message)
        return res.status(401).json({message: 'Unauthorized'})
    }
}

export const authenticateSeller = async (req, res, next) => {
    
    const token = req.cookies.token 

    if(!token){
        return res.status(401).json({message: "Unauthorized"})
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        const user = await userModel.findById(decoded.id)

        if(!user || user.role !== "seller"){
            return res.status(401).json({message: "Unauthorized"})
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({message: "Unauthorized"})
    } 
}