import { createSlice } from "@reduxjs/toolkit";

export const cartSlice = createSlice({
    name: "cart",
    initialState: {
        totalPrice: null,
        currency: null,
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
            const { productId, variantId } = action.payload

            state.items = state.items.map(item => {
                if (item.product._id === productId && item.variant === variantId) {
                    return { ...item, quantity: item.quantity + 1 }
                }
                else {
                    return item
                }
            })
        },
        decrementCartItem: (state, action) => {
            const { productId, variantId } = action.payload
            const idx = state.items.findIndex(
                item => item.product._id === productId && item.variant === variantId
            )
            if (idx === -1) return
            if (state.items[idx].quantity > 1) {
                state.items[idx].quantity -= 1
            } else {
                state.items.splice(idx, 1)
            }
        },
        clearCart: (state) => {
            state.items = []
            state.totalPrice = 0
        }
    }
})

export const { setItems, addItem, incrementCartItem, decrementCartItem, clearCart } = cartSlice.actions
export default cartSlice.reducer