import axios from "axios"

const cartApiInstance = axios.create({
    baseURL: "/api/cart",
    withCredentials: true
})


export const addToCart = async ({ productId, variantId, quantity = 1, size }) => {
    const body = { quantity }
    if (size) body.size = size
    const response = await cartApiInstance.post(`/add/${productId}/${variantId}`, body)

    return response.data
}

export const getCart = async () => {
    const response = await cartApiInstance.get("/")

    return response.data
}

export const incrementCartItemApi = async ({ productId, variantId }) => {

    const response = await cartApiInstance.patch(`/quantity/increment/${productId}/${variantId}`)

    return response.data
}

export const decrementCartItemApi = async ({ productId, variantId})  => {

    const response = await cartApiInstance.patch(`/quantity/decrement/${productId}/${variantId}`)

    return response.data
}

export const createCartOrder = async () => {
    const response = await cartApiInstance.post('/payment/create/order')
    return response.data
}

export const verifyCartOrder  = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    const response = await cartApiInstance.post('/payment/verify/order', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    })
    return response.data
}

export const getOrderDetails = async (orderId) => {
    const response = await cartApiInstance.get(`/order/${orderId}`)
    return response.data
}