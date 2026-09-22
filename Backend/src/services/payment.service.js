import { config } from "../config/config.js"
import Razorpay from "razorpay"


const razorpay = new Razorpay({
  key_id: config.RAZORPAY_APIKEY,
  key_secret: config.RAZORPAY_SECRET
})

export const createOrder = async ({amount, currency = 'INR'}) => {
    const options = {
        amount : amount  * 100, // amount in the smallest currency unit
        currency,
    }

    const order = await razorpay.orders.create(options)

    return order
}