import mongoose from "mongoose"

const priceSchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ["USD", "EUR", "INR"],
        default: "INR"
    }
},{
    _id: false,
    _v: false
})

export default priceSchema