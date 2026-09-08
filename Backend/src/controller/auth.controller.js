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


export async function login(req,res) {
    const { email, password } = req.body

    try{
        const user = await userModel.findOne({
            $or: [
                {email},
                {password}
            ]
        })

        if(!user){
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }
        const isPasswordMatched = await user.comparePassword(password)

        if(!isPasswordMatched){
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        await sendTokenResponse(user,res, "User logged in successfully")
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Server error"
        })
    }
}

export const googleCallback = async (req,res) => {
    console.log(req.user)

    const { id, displayName, emails, photos } = req.user
    const email = emails[0].value
    const profilePic = photos[0].value


    let user = await userModel.findOne({
        email
    })

    if(!user){
        user = await userModel.create({
            email,
            googleId: id,
            fullname: displayName
        })
    }

    const token = jwt.sign({
        id: user._id,
        
    }, config.JWT_SECRET,({expiresIn: '7d'}))

    res.cookie("token", token)
    
    res.redirect("http://localhost:5173")
}
