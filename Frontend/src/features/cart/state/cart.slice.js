import { createSlice } from "@reduxjs/toolkit";

export const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],

    },
    reducers: {
        setItems: (state, action) => {
            state.items = (action.payload)
        },
        addItem: (state, action) => {
            state.items.push(action.payload)
        },
        incrementCartItem: (state, action) => {
            const { productId, varinatId } = action.payload

            state.items = state.items.map(item => {
                if(item.product._id === productId && item.varinat === varinatId){
                    return { ...item, quantity: item.quantity + 1}
                }
                else{
                    return item
                }
            })
        }
    }
})

export const { setItems, addItem, incrementCartItem } = cartSlice.actions
export default cartSlice.reducer