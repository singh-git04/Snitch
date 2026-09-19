import { stockOfVariant } from "../dao/proudct.dao.js"
import cartModel from "../model/cart.model.js"
import productModel from "../model/product.model.js"

export const addToCart = async (req ,res) =>{
    const { productId, variantId } = req.params
    const {quantity = 1 } = req.body

    const product = await productModel.findOne({ 
        _id: productId,
        "variants._id": variantId
    })

    if(!product){
        return res.status(404).json({
            message: "Product or variant not found",
            success: false
        })
    }

    const stock = await stockOfVariant(productId,variantId)

    const cart = (await cartModel.findOne({user: req.user._id})) || (await cartModel({ user: req.user._id}))

    const isProductAlreadyInCart = cart.items.some(item => item.product.toString() ===  productId && item.variant?.toString()=== variantId)

    if(isProductAlreadyInCart){
        const quantityInCart  = cart.items.find(item => item.product.toString()=== productId && item.variant?.toString()===variantId).quantity

        if(quantityInCart + quantity > stock){
            return res.status(400).json({
                message: `Only ${stock} item left in the stock. and you already have ${quantityInCart} item in  your cart`,
                success: false
            })
        }

        await cartModel.findOneAndUpdate(
            {user: req.user._id, "items.product": productId, "items.variant": variantId},
            {$inc: {"items.$.quantity": quantity}},
            {new: true}
        )

        return res.status(200).json({
            message: "Cart updated successfully",
            success: true
        })
    }

    if(quantity > stock){
        return res.status(400).json({
            message: `Only ${stock} items left in stock`,
            success: false
        })
    }

    cart.items.push({
        product: productId,
        variant: variantId,
        quantity,
        price: product.price
    })

    await cart.save()

    return res.status(200).json({
        message: "Product added to cart Successfully",
        success: true
    })


}


export const getCart = async(req, res)=>{

    const user = req.user

    let cart = await cartModel.findOne({ user: user._id }).populate("items.product")

    if(!cart){
        cart = await cartModel.create({ user: user._id })
    }

    return res.status(200).json({
        message: "Cart fetched successfully",
        success: true,
        cart
    })
}

export const incrementCartItemQuantity = async (req, res) => {

    const { productId , variantId } = req.params

    const product = await productModel.findOne({
        _id : productId,
        "variants._id" : variantId
    })

    if(!product){
        return res.status(404).json({
            message: "Product or Variant not found",
            success: false
        })
    }

    const cart  = await cartModel.findOne({ user: req.user._id})

    if(!cart){
        return res.status(404).json({
            message: "Cart not found",
            success: false
        })
    }

    const stock = await stockOfVariant(productId, variantId)

    const itemQuantityInCart = cart.items.find(item => item.product.toString() === productId && item.variant?.toString() === variantId)?.quantity || 0

    if (itemQuantityInCart + 1 > stock){
        return res.status(400).json({
            message: `Only ${stock} items left in stock. and you already have ${itemQuantityInCart } items in you cart`,
            success: false
        })
    }

    await cartModel.findOneAndUpdate(
        { user: req.user._id, "items.product" : productId, "items.variant": variantId},
        { $inc: { "items.$.quantity": 1}},
        { new: true }
    )

    return res.status(200).json({
        message: "Cart item quantity incremented successfully",
        success: true
    })
}