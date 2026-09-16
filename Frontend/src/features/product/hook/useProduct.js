import { createProduct, getSellerProduct, getAllProducts, getProductById, addProductVariant, updateProductVariant, deleteProductVariant } from "../services/product.api"
import { useDispatch } from "react-redux"
import { setSellerProducts, setProducts } from '../state/product.slice'


export const useProduct = () => {

    const dispatch = useDispatch()

    async function handleCreateProduct(formData) {
        const data = await createProduct(formData)

        return data.product
    }

    async function handleGetSellerProduct() {
        const data = await getSellerProduct()
        dispatch(setSellerProducts(data.products))
        return data.products
    }

    async function handleGetAllProducts() {
        try {
            const data = await getAllProducts()
            const list = Array.isArray(data) ? data : (data?.products || [])
            dispatch(setProducts(list))
            return list
        } catch (error) {
            console.error("Failed to load all products:", error)
            return []
        }
    }

    async function handleGetProudctById(productId) {
        const data = await getProductById(productId)

        return data.product
    }

    async function handleAddProductVariant(productId, newProductVariant) {
        const data = await addProductVariant(productId, newProductVariant)

        return data
    }

    async function handleUpdateProductVariant(productId, variantId, variantData) {
        const data = await updateProductVariant(productId, variantId, variantData)

        return data
    }

    async function handleDeleteProductVariant(productId, variantId) {
        const data = await deleteProductVariant(productId, variantId)

        return data
    }

    return {
        handleCreateProduct,
        handleGetSellerProduct,
        handleGetAllProducts,
        handleGetProudctById,
        handleAddProductVariant,
        handleUpdateProductVariant,
        handleDeleteProductVariant
    }
}