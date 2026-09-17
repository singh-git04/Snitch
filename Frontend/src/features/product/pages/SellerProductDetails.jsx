import React, { useEffect, useState, useMemo, useRef } from "react"
import { useParams, Link } from "react-router"
import { useProduct } from "../hook/useProduct"

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
}

const ATTRIBUTE_PRESETS = [
  { key: "Size", options: ["XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36"] },
  { key: "Color", options: ["Black", "White", "Navy", "Beige", "Olive", "Grey", "Brown", "Burgundy"] },
  { key: "Fit", options: ["Regular Fit", "Slim Fit", "Relaxed Fit", "Oversized", "Skinny Fit"] },
  { key: "Material", options: ["100% Cotton", "Linen Blend", "Denim", "Polyester", "Wool Blend", "Silk"] },
]

const SellerProductDetails = () => {
  const { productId } = useParams()
  const { handleGetProudctById, handleAddProductVariant, handleDeleteProductVariant } = useProduct()

  // State
  const [productData, setProductData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState(null) // { type: 'success' | 'error', message: string }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeletingVariant, setIsDeletingVariant] = useState(null) // variant object to delete
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Variant Form State
  const [priceAmount, setPriceAmount] = useState("")
  const [priceCurrency, setPriceCurrency] = useState("INR")
  const [stock, setStock] = useState("0")
  const [attributesList, setAttributesList] = useState([]) // [{ id, key: '', value: '' }]
  const [imagesList, setImagesList] = useState([]) // [{ id, url, file?: File, isExisting?: boolean }]
  const [directUrlInput, setDirectUrlInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)

  // Show temporary notification
  const notify = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  // Load product data
  const loadProduct = async () => {
    if (!productId) return
    setIsLoading(true)
    try {
      const data = await handleGetProudctById(productId)
      if (data) {
        setProductData(data)
      }
    } catch (err) {
      console.warn("Could not fetch product from API:", err)
      notify("Failed to fetch product details", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [productId])

  // Normalizing variants array
  const variants = useMemo(() => {
    if (!productData || !Array.isArray(productData.variants)) return []
    return productData.variants
  }, [productData])

  // Format price helper
  const formatPrice = (priceObj) => {
    if (!priceObj) return "₹0"
    const amount = typeof priceObj === "object" ? priceObj.amount ?? 0 : priceObj
    const currency = typeof priceObj === "object" ? priceObj.currency || "INR" : "INR"
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `
    return `${symbol}${Number(amount).toLocaleString("en-IN")}`
  }

  // Convert attributes from schema (Map or Object) to array
  const normalizeAttributes = (attr) => {
    if (!attr) return []
    if (attr instanceof Map) {
      return Array.from(attr.entries()).map(([k, v]) => ({ key: k, value: String(v) }))
    }
    if (typeof attr === "object") {
      return Object.entries(attr).map(([k, v]) => ({ key: k, value: String(v) }))
    }
    return []
  }

  // Open modal for Adding a new variant
  const handleOpenAddModal = () => {
    setPriceAmount(productData?.price?.amount ? String(productData.price.amount) : "0")
    setPriceCurrency(productData?.price?.currency || "INR")
    setStock("10")
    setAttributesList([
      { id: "attr-1", key: "Size", value: "M" },
      { id: "attr-2", key: "Color", value: "" },
    ])
    setImagesList([])
    setDirectUrlInput("")
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormErrors({})
    setIsSubmitting(false)
  }

  // File upload handling
  const handleFileSelection = (files) => {
    if (!files || files.length === 0) return

    const newEntries = Array.from(files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${file.name}`,
      file,
      url: URL.createObjectURL(file),
      isExisting: false,
    }))

    setImagesList((prev) => [...prev, ...newEntries])
    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: "" }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files)
    }
  }

  const handleAddDirectUrl = () => {
    if (!directUrlInput.trim()) return
    const newEntry = {
      id: `url-${Date.now()}`,
      url: directUrlInput.trim(),
      isExisting: false,
    }
    setImagesList((prev) => [...prev, newEntry])
    setDirectUrlInput("")
    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: "" }))
    }
  }

  const handleRemoveImage = (id) => {
    setImagesList((prev) => prev.filter((img) => img.id !== id))
  }

  // Dynamic Attributes helpers
  const handleAddAttributeRow = () => {
    setAttributesList((prev) => [...prev, { id: `attr-${Date.now()}`, key: "", value: "" }])
  }

  const handleAttributeChange = (id, field, value) => {
    setAttributesList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleRemoveAttributeRow = (id) => {
    setAttributesList((prev) => prev.filter((item) => item.id !== id))
  }

  const handleApplyPreset = (presetKey, presetVal) => {
    setAttributesList((prev) => {
      const existingIdx = prev.findIndex((item) => item.key.toLowerCase() === presetKey.toLowerCase())
      if (existingIdx !== -1) {
        const copy = [...prev]
        copy[existingIdx].value = presetVal
        return copy
      }
      return [...prev, { id: `attr-${Date.now()}`, key: presetKey, value: presetVal }]
    })
  }

  // Form Validation
  const validateForm = () => {
    const errors = {}
    if (!priceAmount || isNaN(Number(priceAmount)) || Number(priceAmount) <= 0) {
      errors.priceAmount = "Please enter a valid price greater than 0"
    }
    if (stock === "" || isNaN(Number(stock)) || Number(stock) < 0) {
      errors.stock = "Stock must be a non-negative number"
    }
    if (imagesList.length === 0) {
      errors.images = "At least one variant image is required"
    }
    return errors
  }

  // Submit Handler (Add or Edit)
  const handleSubmitVariant = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsSubmitting(true)

    // Build attributes object
    const attributesObj = {}
    attributesList.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        attributesObj[attr.key.trim()] = attr.value.trim()
      }
    })

    try {
      const newVariantPayload = {
        price: {
          amount: Number(priceAmount),
          currency: priceCurrency,
        },
        stock: Number(stock),
        attributes: attributesObj,
        images: imagesList,
      }

      const res = await handleAddProductVariant(productId, newVariantPayload)
      if (res?.success) {
        notify("New variant added successfully!")
        if (res.product) {
          setProductData(res.product)
        } else {
          await loadProduct()
        }
        handleCloseModal()
      } else {
        setFormErrors({ submit: res?.message || "Failed to add variant" })
      }
    } catch (err) {
      console.error("Error saving variant:", err)
      setFormErrors({
        submit: err.response?.data?.message || err.message || "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Variant Handler
  const handleConfirmDelete = async () => {
    if (!isDeletingVariant) return
    setIsSubmitting(true)
    try {
      const res = await handleDeleteProductVariant(productId, isDeletingVariant._id)
      if (res?.success) {
        notify("Variant removed successfully")
        if (res.product) {
          setProductData(res.product)
        } else {
          await loadProduct()
        }
        setIsDeletingVariant(null)
      } else {
        notify(res?.message || "Failed to delete variant", "error")
      }
    } catch (err) {
      console.error("Error deleting variant:", err)
      notify(err.response?.data?.message || err.message || "Failed to delete variant", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Aggregated variant statistics
  const totalVariantStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
  }, [variants])
console.log(productData)
  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-black selection:text-white antialiased font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3 text-xs font-mono tracking-wider uppercase border shadow-lg flex items-center gap-3 ${notification.type === "error"
                ? "bg-red-950 text-red-200 border-red-800"
                : "bg-black text-white border-neutral-700"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {notification.type === "error" ? "error" : "check_circle"}
            </span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold tracking-[0.2em] text-black hover:opacity-75 transition-opacity">
              SNITCH
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 font-mono tracking-wider border-l border-neutral-200 pl-6">
              <Link to="/seller/dashboard" className="hover:text-black transition-colors">
                DASHBOARD
              </Link>
              <span>/</span>
              <span className="text-black">PRODUCT VARIANTS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/seller/dashboard"
              className="text-xs font-mono text-neutral-500 hover:text-black transition-colors flex items-center gap-1.5 uppercase tracking-wider px-3 py-2 border border-neutral-200 hover:border-black"
            >
              <span>← Back to Dashboard</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="bg-black text-white hover:bg-neutral-800 font-medium text-xs tracking-wider uppercase px-4 py-2.5 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Variant</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8 animate-pulse">
            <div className="h-44 bg-neutral-100 border border-neutral-200" />
            <div className="h-64 bg-neutral-100 border border-neutral-200" />
          </div>
        )}

        {/* Product Not Found */}
        {!isLoading && !productData && (
          <div className="border border-neutral-200 bg-neutral-50 p-16 text-center my-12">
            <h3 className="text-lg font-light text-neutral-900 mb-2">Product Not Found</h3>
            <p className="text-sm text-neutral-500 mb-6 font-light">
              Could not retrieve product with ID "{productId}".
            </p>
            <Link
              to="/seller/dashboard"
              className="inline-block bg-black text-white px-6 py-2.5 text-xs font-mono uppercase tracking-wider hover:bg-neutral-800"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {!isLoading && productData && (
          <>
            {/* ==================== PRODUCT OVERVIEW CARD ==================== */}
            <section className="border border-neutral-200 bg-white p-6 sm:p-8 mb-10">
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                {/* Product Images & Title */}
                <div className="flex flex-col sm:flex-row gap-6 items-start flex-1">
                  <div className="w-28 h-36 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
                    {productData.images && productData.images.length > 0 ? (
                      <img
                        src={typeof productData.images[0] === "object" ? productData.images[0].url : productData.images[0]}
                        alt={productData.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-xs">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                        PRODUCT ID: #{productData._id?.slice(-8)}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700">
                        {variants.length} {variants.length === 1 ? "Variant" : "Variants"}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900">
                      {productData.title}
                    </h1>

                    <p className="text-xs text-neutral-500 font-light max-w-xl leading-relaxed">
                      {productData.description || "No description specified for this product."}
                    </p>

                    <div className="pt-2 flex items-center gap-6 text-xs font-mono text-neutral-600">
                      <div>
                        <span className="text-neutral-400">BASE PRICE: </span>
                        <span className="font-semibold text-black">{formatPrice(productData.price)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400">COMBINED STOCK: </span>
                        <span className="font-semibold text-black">{totalVariantStock} Units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-150">
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-black text-white hover:bg-neutral-800 text-xs font-medium uppercase tracking-wider px-5 py-3 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Add New Variant</span>
                  </button>
                </div>
              </div>
            </section>

            {/* ==================== VARIANTS SECTION ==================== */}
            <section className="mb-16">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200">
                <div>
                  <h2 className="text-xl font-light text-neutral-900">Configured Variants</h2>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">
                    Product variants allow you to define different sizes, colors, pricing, and stock levels.
                  </p>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  {variants.length} {variants.length === 1 ? "ITEM" : "ITEMS"}
                </span>
              </div>

              {/* EMPTY VARIANTS STATE */}
              {variants.length === 0 && (
                <div className="border border-dashed border-neutral-300 bg-neutral-50/70 p-12 text-center rounded-none">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-2xl">style</span>
                  </div>
                  <h3 className="text-base font-medium text-neutral-900 mb-1">No Variants Configured</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mb-6 font-light leading-relaxed">
                    Variants are optional attributes (e.g. Size, Color, Material) with independent pricing, stock, and images.
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Create First Variant</span>
                  </button>
                </div>
              )}

              {/* VARIANTS GRID */}
              {variants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {variants.map((variant, index) => {
                    const variantImgs = Array.isArray(variant.images) && variant.images.length > 0
                      ? variant.images.map((img) => (typeof img === "object" ? img.url : img))
                      : []
                    const primaryImg = variantImgs[0] || (productData.images?.[0]?.url || productData.images?.[0]) || ""
                    const attrs = normalizeAttributes(variant.attributes)
                    const stockNum = Number(variant.stock) || 0

                    return (
                      <article
                        key={variant._id || index}
                        className="border border-neutral-200 hover:border-black bg-white transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Top bar */}
                          <div className="p-4 border-b border-neutral-150 flex items-center justify-between text-xs font-mono bg-neutral-50/50">
                            <span className="text-neutral-500 font-medium">VARIANT #{index + 1}</span>
                            <span
                              className={`px-2 py-0.5 text-[10px] tracking-wider uppercase font-mono ${stockNum > 10
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : stockNum > 0
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                                }`}
                            >
                              {stockNum > 10 ? `In Stock (${stockNum})` : stockNum > 0 ? `Low Stock (${stockNum})` : "Out of Stock"}
                            </span>
                          </div>

                          {/* Image & Main Info */}
                          <div className="p-5 flex gap-4">
                            <div className="w-24 h-32 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 relative">
                              {primaryImg ? (
                                <img
                                  src={primaryImg}
                                  alt={`Variant ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-[10px] text-center p-1">
                                  NO IMAGE
                                </div>
                              )}
                              {variantImgs.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5">
                                  +{variantImgs.length - 1}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">PRICE</span>
                                <div className="text-xl font-light text-black font-mono">
                                  {formatPrice(variant.price)}
                                </div>
                              </div>

                              {/* Attributes Tags */}
                              <div className="mt-3">
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1.5">
                                  ATTRIBUTES
                                </span>
                                {attrs.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {attrs.map((attr, aIdx) => (
                                      <span
                                        key={aIdx}
                                        className="inline-flex items-center text-[11px] font-mono bg-neutral-100 px-2 py-0.5 text-neutral-800 border border-neutral-200"
                                      >
                                        <strong className="text-neutral-500 font-normal mr-1">{attr.key}:</strong>
                                        {attr.value}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-neutral-400 italic">No attributes defined</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Bottom Bar */}
                        <div className="px-5 py-3 border-t border-neutral-150 bg-neutral-50/50 flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400 text-[11px]">
                            ID: {variant._id ? variant._id.slice(-6) : `idx-${vIdx + 1}`}
                          </span>
                          <button
                            onClick={() => setIsDeletingVariant(variant)}
                            className="text-neutral-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Delete Variant"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ==================== ADD VARIANT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="bg-white border border-neutral-300 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  CREATE VARIANT
                </span>
                <h3 className="text-xl font-light text-neutral-900 mt-0.5">
                  Add Product Variant
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-neutral-400 hover:text-black p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitVariant} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              {formErrors.submit && (
                <div className="p-3 text-xs font-mono bg-red-50 text-red-700 border border-red-200">
                  {formErrors.submit}
                </div>
              )}

              {/* Row: Pricing & Currency & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Price Amount */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-2">
                    Variant Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-400">
                      {CURRENCY_SYMBOLS[priceCurrency] || ""}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value)}
                      placeholder="e.g. 199"
                      className={`w-full bg-neutral-50 border ${formErrors.priceAmount ? "border-red-500" : "border-neutral-200"
                        } focus:border-black text-neutral-900 text-xs pl-8 pr-3 py-2.5 outline-none font-mono transition-colors`}
                    />
                  </div>
                  {formErrors.priceAmount && (
                    <span className="text-[10px] font-mono text-red-600 mt-1 block">{formErrors.priceAmount}</span>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-2">
                    Currency *
                  </label>
                  <select
                    value={priceCurrency}
                    onChange={(e) => setPriceCurrency(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs px-3 py-2.5 outline-none font-mono transition-colors cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 mb-2">
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g. 25"
                    className={`w-full bg-neutral-50 border ${formErrors.stock ? "border-red-500" : "border-neutral-200"
                      } focus:border-black text-neutral-900 text-xs px-3 py-2.5 outline-none font-mono transition-colors`}
                  />
                  {formErrors.stock && (
                    <span className="text-[10px] font-mono text-red-600 mt-1 block">{formErrors.stock}</span>
                  )}
                </div>
              </div>

              {/* Dynamic Attributes Builder */}
              <div className="border-t border-neutral-150 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-800">
                      Attributes (Key - Value Pairs)
                    </label>
                    <p className="text-[11px] text-neutral-400 font-light">
                      Map characteristics like size, color, or material to this specific variant.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttributeRow}
                    className="text-xs font-mono uppercase tracking-wider text-black hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add Attribute</span>
                  </button>
                </div>

                {/* Quick Presets Pills */}
                <div className="mb-4 bg-neutral-50 p-3 border border-neutral-200 space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    QUICK PRESETS:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ATTRIBUTE_PRESETS.map((preset) => (
                      <div key={preset.key} className="flex items-center gap-1">
                        <span className="text-[11px] font-mono text-neutral-500">{preset.key}:</span>
                        <div className="flex flex-wrap gap-1">
                          {preset.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleApplyPreset(preset.key, opt)}
                              className="text-[10px] font-mono bg-white hover:bg-black hover:text-white text-neutral-700 border border-neutral-300 px-1.5 py-0.5 transition-colors"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attribute rows */}
                <div className="space-y-3">
                  {attributesList.map((attr) => (
                    <div key={attr.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Key (e.g. Size, Color)"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(attr.id, "key", e.target.value)}
                        className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs px-3 py-2 outline-none font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. XL, Navy Blue)"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(attr.id, "value", e.target.value)}
                        className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs px-3 py-2 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttributeRow(attr.id)}
                        className="text-neutral-400 hover:text-red-600 p-2 transition-colors"
                        title="Remove Attribute"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}

                  {attributesList.length === 0 && (
                    <div className="text-center py-4 text-xs font-mono text-neutral-400 border border-dashed border-neutral-200">
                      No attributes added yet. Click "+ Add Attribute" or select from presets above.
                    </div>
                  )}
                </div>
              </div>

              {/* Variant Images */}
              <div className="border-t border-neutral-150 pt-6">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-800 mb-1">
                  Variant Images *
                </label>
                <p className="text-[11px] text-neutral-400 font-light mb-4">
                  Upload image files or supply image URLs that showcase this specific variant.
                </p>

                {formErrors.images && (
                  <div className="text-[10px] font-mono text-red-600 mb-3">{formErrors.images}</div>
                )}

                {/* File Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed p-6 text-center cursor-pointer transition-colors ${isDragging
                      ? "border-black bg-neutral-100"
                      : "border-neutral-300 bg-neutral-50/60 hover:bg-neutral-100"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelection(e.target.files)}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-neutral-400 text-3xl mb-1">cloud_upload</span>
                  <div className="text-xs font-mono text-neutral-700">
                    Click to browse files or drag & drop images here
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-1">PNG, JPG, WEBP up to 5MB</div>
                </div>

                {/* Direct Image URL input */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (https://...)"
                    value={directUrlInput}
                    onChange={(e) => setDirectUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddDirectUrl()
                      }
                    }}
                    className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs px-3 py-2 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirectUrl}
                    className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-mono px-3 py-2 transition-colors uppercase tracking-wider"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Image Previews List */}
                {imagesList.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {imagesList.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-[3/4] bg-neutral-100 border border-neutral-200 group overflow-hidden"
                      >
                        <img src={img.url} alt="Variant preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                          title="Remove image"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                        {img.isExisting && (
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1">
                            EXISTING
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 border border-neutral-300 text-xs font-mono uppercase tracking-wider text-neutral-700 hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitVariant}
                disabled={isSubmitting}
                className="px-6 py-2 bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Create Variant</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {isDeletingVariant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white border border-neutral-300 shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <h4 className="text-lg font-light text-neutral-900 mb-2">Delete Product Variant</h4>
            <p className="text-xs text-neutral-500 font-light leading-relaxed mb-6">
              Are you sure you want to delete this variant? This action cannot be undone and will remove the variant from
              inventory.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeletingVariant(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-8 py-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-500 text-xs font-mono">
        <div>SNITCH © {new Date().getFullYear()}</div>
        <div className="flex items-center gap-6">
          <Link to="/seller/dashboard" className="hover:text-black transition-colors">
            Inventory
          </Link>
          <Link to="/seller/create-product" className="hover:text-black transition-colors">
            Add Product
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default SellerProductDetails
