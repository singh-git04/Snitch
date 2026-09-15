import productModel from "../model/product.model.js"
import { uploadFile } from "../services/storage.service.js"


export async function createProduct(req,res) {
    const {title, description, priceAmount, priceCurrency} = req.body
    const seller = req.user

    const images = await Promise.all(req.files.map(async (file)=>{

        return await uploadFile({
            buffer: file.buffer,
            fileName: file.originalname
        })
    }))

    const product = await productModel.create({
        title,
        description,
        price:{
            amount: priceAmount,
            currency: priceCurrency || 'INR'
        },
        images,
        seller: seller._id
    })
console.log("BODY:", req.body)
    console.log("FILES:", req.files)

    res.status(201).json({
        message: "Product Created Sucessfully",
        success: true,
        product
    })
}

export async function getSellerProducts(req,res) {
    const seller = req.user

    const products = await productModel.find({seller: seller._id})

    res.status(200).json({
        message: "Seller Products Feteched Successfully",
        success: true,
        products
    })
}


export async function getAllProducts(req,res) {
    const products = await productModel.find()

     res.status(200).json({
        message: "Products fetched Sucessfully",
        success: true,
        products
    })
}

export async function getProductById(req,res) {
    const { id } = req.params
    
    const product = await productModel.findById(id)

    if(!product){
        return res.status(404).json({
            message: "Product not found",
            success: false
        })
    }

    return res.status(200).json({
        message: "Product details fetched successfully",
        success: true,
        product
    })
}