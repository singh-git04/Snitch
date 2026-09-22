import { addToCart, createCartOrder, getCart, incrementCartItemApi,verifyCartOrder } from "../service/cart.api.js"
import { useDispatch } from "react-redux"
import { addItem as addItemToCart, setItems, incrementCartItem } from "../state/cart.slice"

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

    async function handleCreateCartOrder() {
        const data = await createCartOrder()
        return data.order
    }

    async function handleVerifyCartOrder(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
        const data = await verifyCartOrder(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        return data.order
    }

    return { handleAddItem, handleGetCart, handleIncrementCartItem, handleCreateCartOrder, handleVerifyCartOrder }
}
