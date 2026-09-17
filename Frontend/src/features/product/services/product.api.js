import axios from "axios"

const productApiInstance = axios.create({
    baseURL: "/api/products",
    withCredentials: true
})


export async function createProduct(formData) {

    const response = await productApiInstance.post('/', formData)

    return response.data
}

export async function getSellerProduct() {

    const response = await productApiInstance.get('/seller')

    return response.data
}

export async function getAllProducts() {
    const response = await productApiInstance.get('/')

    return response.data
}

export async function getProductById(productId) {
    const response = await productApiInstance.get(`/detail/${productId}`)

    return response.data
}

export async function addProductVariant(productId, newProductVariant) {
    if (newProductVariant instanceof FormData) {
        const response = await productApiInstance.post(`/${productId}/variants`, newProductVariant)
        return response.data
    }

    const formData = new FormData()

    if (Array.isArray(newProductVariant.images)) {
        const imageUrls = []
        newProductVariant.images.forEach((image) => {
            if (image.file) {
                formData.append("images", image.file)
            } else if (image.url) {
                imageUrls.push(image.url)
            }
        })
        if (imageUrls.length > 0) {
            formData.append("imageUrls", JSON.stringify(imageUrls))
        }
    }

    if (newProductVariant.stock !== undefined) {
        formData.append("stock", newProductVariant.stock)
    }

    if (newProductVariant.price) {
        if (newProductVariant.price.amount !== undefined) {
            formData.append("priceAmount", newProductVariant.price.amount)
        }
        if (newProductVariant.price.currency) {
            formData.append("priceCurrency", newProductVariant.price.currency)
        }
    }

    if (newProductVariant.attributes) {
        formData.append("attributes", JSON.stringify(newProductVariant.attributes))
    }

    const response = await productApiInstance.post(`/${productId}/variants`, formData)

    return response.data
}

export async function deleteProductVariant(productId, variantId) {
    const response = await productApiInstance.delete(`/${productId}/variants/${variantId}`)
    return response.data
}