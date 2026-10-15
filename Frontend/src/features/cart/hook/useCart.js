import { addToCart, createCartOrder, decrementCartItemApi, getCart, incrementCartItemApi, verifyCartOrder, getOrderDetails } from "../service/cart.api.js"
import { useDispatch } from "react-redux"
import { addItem as addItemToCart, setItems, incrementCartItem, decrementCartItem, clearCart } from "../state/cart.slice"

export const useCart = () => {
    const dispatch = useDispatch()

    async function handleAddItem({ productId, variantId, quantity = 1, size }) {
        const data = await addToCart({ productId, variantId, quantity, size })
        return data
    }

    async function handleGetCart() {
        const data = await getCart()
        dispatch(setItems(data.cart.items))
    }

    async function handleIncrementCartItem({ productId, variantId }) {
        const data = await incrementCartItemApi({ productId, variantId })
        dispatch(incrementCartItem({ productId, variantId }))
    }

    async function handledecrementCartItem({ productId, variantId }) {
        const data = await decrementCartItemApi({ productId, variantId })
        dispatch(decrementCartItem({ productId, variantId }))
    }

    async function handleCreateCartOrder() {
        const data = await createCartOrder()
        return data.order
    }

    async function handleVerifyCartOrder(arg1, arg2, arg3) {
        let payload
        if (typeof arg1 === "object" && arg1 !== null) {
            payload = arg1
        } else {
            payload = {
                razorpay_order_id: arg1,
                razorpay_payment_id: arg2,
                razorpay_signature: arg3
            }
        }
        const data = await verifyCartOrder(payload)
        return data
    }

    async function handleGetOrderDetails(orderId) {
        const data = await getOrderDetails(orderId)
        return data
    }

    return { handleAddItem, handleGetCart, handleIncrementCartItem, handledecrementCartItem, handleCreateCartOrder, handleVerifyCartOrder, handleGetOrderDetails }
}