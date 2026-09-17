import productModel from "../model/product.model.js"
import { uploadFile } from "../services/storage.service.js"


export async function createProduct(req, res) {
    const { title, description, priceAmount, priceCurrency } = req.body
    const seller = req.user

    const images = await Promise.all(req.files.map(async (file) => {

        return await uploadFile({
            buffer: file.buffer,
            fileName: file.originalname
        })
    }))

    const product = await productModel.create({
        title,
        description,
        price: {
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

export async function getSellerProducts(req, res) {
    const seller = req.user

    const products = await productModel.find({ seller: seller._id })

    res.status(200).json({
        message: "Seller Products Feteched Successfully",
        success: true,
        products
    })
}


export async function getAllProducts(req, res) {
    const products = await productModel.find()

    res.status(200).json({
        message: "Products fetched Sucessfully",
        success: true,
        products
    })
}

export async function getProductById(req, res) {
    const { id } = req.params

    const product = await productModel.findById(id)

    if (!product) {
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

export async function addProductVariant(req, res) {
    try {
        const productId = req.params.productId

        const product = await productModel.findOne({
            _id: productId,
            seller: req.user._id
        })

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false
            })
        }

        const files = req.files || []
        let uploadedImages = []
        if (files.length > 0) {
            uploadedImages = await Promise.all(files.map(async (file) => {
                const result = await uploadFile({
                    buffer: file.buffer,
                    fileName: file.originalname
                })
                return { url: result.url }
            }))
        }

        let directImages = []
        if (req.body.imageUrls) {
            try {
                const parsed = typeof req.body.imageUrls === "string" ? JSON.parse(req.body.imageUrls) : req.body.imageUrls
                if (Array.isArray(parsed)) {
                    directImages = parsed.map(u => ({ url: typeof u === 'object' ? u.url : u }))
                }
            } catch (err) {
                console.error("Error parsing imageUrls:", err)
            }
        }

        const images = [...uploadedImages, ...directImages]
        const priceAmount = Number(req.body.priceAmount ?? req.body.price?.amount ?? product.price.amount)
        const priceCurrency = req.body.priceCurrency || req.body.price?.currency || product.price.currency || "INR"
        const stock = Number(req.body.stock ?? 0)

        let attributes = {}
        if (req.body.attributes) {
            try {
                attributes = typeof req.body.attributes === "string" ? JSON.parse(req.body.attributes) : req.body.attributes
            } catch (err) {
                console.error("Error parsing attributes:", err)
            }
        }

        const newVariant = {
            images,
            price: {
                amount: priceAmount,
                currency: priceCurrency
            },
            stock,
            attributes
        }

        product.variants.push(newVariant)
        await product.save()

        const createdVariant = product.variants[product.variants.length - 1]

        return res.status(201).json({
            message: "Product variant added successfully",
            success: true,
            product,
            variant: createdVariant
        })
    } catch (error) {
        console.error("Error in addProductVariant:", error)
        return res.status(500).json({
            message: error.message || "Failed to add product variant",
            success: false
        })
    }
}

export async function deleteProductVariant(req, res) {
    try {
        const { productId, variantId } = req.params

        const product = await productModel.findOne({
            _id: productId,
            seller: req.user._id
        })

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false
            })
        }

        product.variants = product.variants.filter(v => v._id.toString() !== variantId)
        await product.save()

        return res.status(200).json({
            message: "Product variant deleted successfully",
            success: true,
            product
        })
    } catch (error) {
        console.error("Error in deleteProductVariant:", error)
        return res.status(500).json({
            message: error.message || "Failed to delete product variant",
            success: false
        })
    }
}