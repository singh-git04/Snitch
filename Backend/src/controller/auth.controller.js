import {userModel} from "../model/user.model.js"
import jwt from "jsonwebtoken"
import config from "../config/config.js"


async function sendTokenResponse(user,res){
    
    const token = jwt.sign({
        id:user._id,
        email:user.email
    },config.JWT_SECRET,{
        expiresIn: "1d"
    })
}

export async function register(req,res) {

    const { email, password, fullname, contact } = req.body


    try {

        const existingUser = await userModel.findOne({

            $or: [
                {email},
                {contact}
            ]
        })
        

        if(existingUser) {
            return res.status(400).json({
                message: "User already exists with this email or contact"
            })
        }
        const user = await userModel.create({
            email,
            password,
            fullname,
            contact
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Server error"
        })
    }
    
}
