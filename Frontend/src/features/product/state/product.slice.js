import { createSlice } from "@reduxjs/toolkit"

const productSlice = createSlice({
    name : "product",
    initialState: {
        sellerProducts: []
    },
    reducers: {
        setSellerProducts: (state,action) =>{
            state.sellerProducts = action.payload
        }
    }
})

export {sellerProducts} from productSlice.actions
export default productSlice.reducer