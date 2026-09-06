import {userModel} from "../model/user.model.js"
import jwt from "jsonwebtoken"
import {config} from "../config/config.js"


async function sendTokenResponse(user,res, message) {
    
    const token = jwt.sign({
        id:user._id,
        email:user.email
    },config.JWT_SECRET,{
        expiresIn: "7d"
    })

    res.cookie("token",token)

    res.status(200).json({
        message,
        success: true,
        user:{
            id: user._id,
            email: user.email,
            fullname: user.fullname,
            contact: user.contact,
            role: user.role
        }

    })
}

export async function register(req,res) {

    const { email, password, fullname, contact, isSeller } = req.body

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
            contact,
            role: isSeller ? "seller" : "buyer"
        })

        await sendTokenResponse(user,res, "User registered successfully")
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Server error"
        })
    }
    
}
