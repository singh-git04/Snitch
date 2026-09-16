import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useProduct } from '../hook/useProduct'

const SellerProductDetails = () => {

  const { productId } = useParams()
  const { handleGetProudctById ,handleAddProductVariant } = useProduct()
  const [productData, setProductData] = useState(null)
  useEffect(() => {
    async function fetchProuductDetails() {
      if (productId) {
        try {
          const data = await handleGetProudctById(productId)
          if (data) {
            setProductData(data)
          }
        } catch (err) {
          console.warn("Could not fetch product from API, using fallback data", err)
        }
      }
    }
    fetchProuductDetails()
  }, [productId])

  console.log(productData)
  return (
    <div>
      selel
    </div>
  )
}

export default SellerProductDetails
