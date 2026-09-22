import React, { useState, useRef, useMemo } from 'react' // useMemo kept for primaryImage
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { useProduct } from '../hook/useProduct'

const PRESET_COLORS = ['Black', 'White', 'Navy', 'Olive', 'Beige', 'Grey', 'Brown', 'Burgundy']
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38']

const CreateProduct = () => {
  const navigate = useNavigate()
  const { handleCreateProduct, handleAddProductVariant } = useProduct()
  const seller = useSelector((state) => state.auth.user)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceAmount, setPriceAmount] = useState('')
  const [priceCurrency, setPriceCurrency] = useState('INR')
  const [category, setCategory] = useState('Clothing')

  // Color & Size Attributes State
  const [color, setColor] = useState('Black')
  const [customColor, setCustomColor] = useState('')
  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L', 'XL'])
  // Single total stock for the color variant (sizes are just attributes, not separate variants)
  const [totalStock, setTotalStock] = useState(10)

  // Images state: array of items: { id, file?: File, url: string, isCover?: boolean }
  const [imagesList, setImagesList] = useState([])
  const [directUrlInput, setDirectUrlInput] = useState('')

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)

  const parsedPrice = parseFloat(priceAmount) || 0
  const activeColor = customColor.trim() || color || ''

  const handleToggleSize = (size) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) {
        return prev.filter((s) => s !== size)
      } else {
        return [...prev, size]
      }
    })
    if (errors.sizes) {
      setErrors((prev) => ({ ...prev, sizes: '' }))
    }
  }

  // Cover image for live preview
  const primaryImage = useMemo(() => {
    const cover = imagesList.find((img) => img.isCover)
    return cover ? cover.url : imagesList[0]?.url || ''
  }, [imagesList])

  // Handle file uploads
  const handleFiles = (files) => {
    if (!files || files.length === 0) return

    const newEntries = Array.from(files).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file: file,
      url: URL.createObjectURL(file),
      isCover: imagesList.length === 0 && idx === 0,
    }))

    setImagesList((prev) => {
      const merged = [...prev, ...newEntries]
      if (!merged.some((img) => img.isCover) && merged.length > 0) {
        merged[0].isCover = true
      }
      return merged
    })

    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleAddDirectUrl = () => {
    if (!directUrlInput.trim()) return
    const newEntry = {
      id: `${Date.now()}-url`,
      url: directUrlInput.trim(),
      isCover: imagesList.length === 0,
    }

    setImagesList((prev) => [...prev, newEntry])
    setDirectUrlInput('')
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }))
    }
  }

  const handleRemoveImage = (id, e) => {
    e.stopPropagation()
    setImagesList((prev) => {
      const updated = prev.filter((img) => img.id !== id)
      if (updated.length > 0 && !updated.some((img) => img.isCover)) {
        updated[0].isCover = true
      }
      return updated
    })
  }

  const handleSetCover = (id, e) => {
    e.stopPropagation()
    setImagesList((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === id,
      }))
    )
  }

  const validate = () => {
    const errs = {}
    if (!title.trim()) errs.title = 'Product title is required'
    if (!description.trim()) errs.description = 'Product description is required'
    if (!priceAmount || parsedPrice <= 0) errs.priceAmount = 'Please enter a valid price'
    if (imagesList.length === 0) errs.images = 'At least 1 product image is required'
    if (selectedSizes.length === 0) errs.sizes = 'Please select at least one size'
    if (!totalStock || Number(totalStock) <= 0) errs.stock = 'Please enter a valid stock quantity'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setErrors({})
    setIsSubmitting(true)
    setSuccessMessage('')

    const sellerId = seller?._id || '6aa2e4dbe763976ef634087b'
    const rawFiles = imagesList.filter((img) => img.file instanceof File).map((img) => img.file)
    const urlStrings = imagesList.filter((img) => !img.file && img.url).map((img) => img.url)

    try {
      let createdProduct = null

      if (rawFiles.length > 0) {
        // FormData for multipart upload
        const fd = new FormData()
        fd.append('title', title.trim())
        fd.append('description', description.trim())
        fd.append('priceAmount', priceAmount)
        fd.append('priceCurrency', priceCurrency || 'INR')
        fd.append('seller', sellerId)
        if (activeColor) {
          fd.append('color', activeColor)
        }
        fd.append(
          'attributes',
          JSON.stringify({
            Color: activeColor,
            Sizes: selectedSizes,
          })
        )

        rawFiles.forEach((file) => fd.append('images', file))
        urlStrings.forEach((url) => fd.append('images', url))

        createdProduct = await handleCreateProduct(fd)
      } else {
        // Standard JSON payload
        const payload = {
          title: title.trim(),
          description: description.trim(),
          price: {
            amount: Number(priceAmount),
            currency: priceCurrency || 'INR',
          },
          images: urlStrings.map((url) => ({ url })),
          seller: sellerId,
          attributes: {
            Color: activeColor,
            Sizes: selectedSizes,
          },
        }

        try {
          createdProduct = await handleCreateProduct(payload)
        } catch (jsonErr) {
          const fd = new FormData()
          fd.append('title', title.trim())
          fd.append('description', description.trim())
          fd.append('priceAmount', priceAmount)
          fd.append('priceCurrency', priceCurrency || 'INR')
          fd.append('seller', sellerId)
          if (activeColor) {
            fd.append('color', activeColor)
          }
          urlStrings.forEach((url) => fd.append('images', url))
          createdProduct = await handleCreateProduct(fd)
        }
      }

      // Create ONE variant per color — sizes are stored as an attribute array, not separate variants
      if (createdProduct && createdProduct._id) {
        const variantPayload = {
          price: {
            amount: Number(priceAmount),
            currency: priceCurrency || 'INR',
          },
          stock: Number(totalStock),
          attributes: {
            ...(activeColor ? { Color: activeColor } : {}),
            Sizes: selectedSizes,
          },
          images: imagesList,
        }
        try {
          await handleAddProductVariant(createdProduct._id, variantPayload)
        } catch (vErr) {
          console.warn('Failed to add color variant:', vErr)
        }
      }

      setSuccessMessage('Product and variants created successfully.')
      setTimeout(() => {
        navigate('/seller/dashboard')
      }, 1200)
    } catch (err) {
      console.error('Error creating product:', err)
      setErrors({
        submit: err.response?.data?.message || err.message || 'Failed to create product. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased font-sans selection:bg-black selection:text-white">
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold tracking-[0.2em] text-black hover:opacity-75 transition-opacity">
              SNITCH
            </Link>
            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
              / SELLER PORTAL
            </span>
          </div>

          <Link
            to="/seller/dashboard"
            className="text-xs font-mono text-neutral-500 hover:text-black transition-colors flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span>←</span>
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* ==================== MAIN FORM ==================== */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-10 pb-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-900">
              Create Product
            </h1>
            <p className="text-sm text-neutral-500 mt-2 font-light">
              Add a new item to your store inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTitle('')
              setDescription('')
              setPriceAmount('')
              setColor('Black')
              setCustomColor('')
              setSelectedSizes(['S', 'M', 'L', 'XL'])
              setImagesList([])
              setErrors({})
            }}
            className="text-xs font-mono text-neutral-400 hover:text-black uppercase tracking-wider transition-colors self-start sm:self-auto"
          >
            Reset Form
          </button>
        </div>

        {/* Success / Error Banners */}
        {successMessage && (
          <div className="mb-8 p-4 border border-neutral-300 bg-neutral-50 text-neutral-800 text-xs font-mono">
            {successMessage} Redirecting to dashboard...
          </div>
        )}

        {errors.submit && (
          <div className="mb-8 p-4 border border-red-200 bg-red-50 text-red-600 text-xs font-mono">
            {errors.submit}
          </div>
        )}

        {/* Two-Column Form Layout */}
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Form Fields (Left ~60%) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                Product Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
                }}
                placeholder="e.g. Classic Oversized Box Tee"
                className={`w-full bg-neutral-50 border ${
                  errors.title ? 'border-red-500' : 'border-neutral-200'
                } focus:border-black text-neutral-900 text-sm px-4 py-3 outline-none placeholder:text-neutral-400 transition-colors`}
              />
              {errors.title && <p className="text-xs text-red-600 font-mono mt-1">{errors.title}</p>}
            </div>

            {/* Category & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="category" className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs px-4 py-3 focus:border-black outline-none cursor-pointer"
                  >
                    <option>Clothing</option>
                    <option>Outerwear</option>
                    <option>Denim</option>
                    <option>Footwear</option>
                    <option>Accessories</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label htmlFor="currency" className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                  Currency
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={priceCurrency}
                    onChange={(e) => setPriceCurrency(e.target.value)}
                    className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs px-4 py-3 focus:border-black outline-none cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label htmlFor="priceAmount" className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                Price ({priceCurrency}) *
              </label>
              <div
                className={`relative flex items-center bg-neutral-50 border ${
                  errors.priceAmount ? 'border-red-500' : 'border-neutral-200'
                } focus-within:border-black transition-colors`}
              >
                <span className="text-xs font-mono text-neutral-400 px-4 py-3 border-r border-neutral-200">
                  {priceCurrency === 'INR' ? '₹' : priceCurrency}
                </span>
                <input
                  id="priceAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={priceAmount}
                  onChange={(e) => {
                    setPriceAmount(e.target.value)
                    if (errors.priceAmount) setErrors((prev) => ({ ...prev, priceAmount: '' }))
                  }}
                  placeholder="1000"
                  className="w-full bg-transparent border-0 text-neutral-900 text-sm px-4 py-3 outline-none placeholder:text-neutral-400 font-mono"
                />
              </div>
              {errors.priceAmount && (
                <p className="text-xs text-red-600 font-mono mt-1">{errors.priceAmount}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
                }}
                placeholder="Product material, fit details, sizing notes..."
                className={`w-full bg-neutral-50 border ${
                  errors.description ? 'border-red-500' : 'border-neutral-200'
                } focus:border-black text-neutral-900 text-sm p-4 outline-none placeholder:text-neutral-400 transition-colors leading-relaxed`}
              />
              {errors.description && (
                <p className="text-xs text-red-600 font-mono mt-1">{errors.description}</p>
              )}
            </div>

            {/* ==================== ATTRIBUTES: COLOR & SIZES ==================== */}
            <div className="space-y-6 pt-2 border-t border-neutral-200">
              <div className="border-b border-neutral-200 pb-3">
                <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-900">
                  Product Variants & Attributes
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-mono">
                  Configure color and available sizes to automatically generate product variants.
                </p>
              </div>

              {/* Color Attribute */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Color: <span className="text-neutral-900 font-bold">{activeColor || 'None'}</span>
                  </label>
                  {customColor && (
                    <button
                      type="button"
                      onClick={() => setCustomColor('')}
                      className="text-[10px] font-mono text-neutral-400 hover:text-black underline"
                    >
                      Clear custom
                    </button>
                  )}
                </div>

                {/* Preset Color Swatches */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = activeColor.toLowerCase() === c.toLowerCase()
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setColor(c)
                          setCustomColor('')
                        }}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all ${
                          isSelected
                            ? 'border-black bg-black text-white font-bold shadow-sm'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Or enter custom color (e.g. Sage Green, Charcoal)..."
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs px-3 py-2.5 outline-none placeholder:text-neutral-400 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Size & Stock Attribute */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                    Available Sizes * ({selectedSizes.length} Selected)
                  </label>
                  <div className="flex gap-2 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setSelectedSizes([...CLOTHING_SIZES])}
                      className="text-neutral-500 hover:text-black underline"
                    >
                      All Standard
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSizes([])}
                      className="text-neutral-500 hover:text-black underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Clothing Size Chips */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1.5">
                    Standard Apparel
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CLOTHING_SIZES.map((sz) => {
                      const isSelected = selectedSizes.includes(sz)
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`min-w-[48px] h-10 px-3 text-xs font-bold font-mono uppercase border-2 transition-all ${
                            isSelected
                              ? 'border-black bg-black text-white shadow-sm'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Numeric Sizes (Pants / Footwear) */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1.5">
                    Numeric Sizing (Pants / Denim)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {NUMERIC_SIZES.map((sz) => {
                      const isSelected = selectedSizes.includes(sz)
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`min-w-[48px] h-10 px-3 text-xs font-bold font-mono uppercase border-2 transition-all ${
                            isSelected
                              ? 'border-black bg-black text-white shadow-sm'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {errors.sizes && <p className="text-xs text-red-600 font-mono mt-1">{errors.sizes}</p>}

                {/* Total Stock for this Color Variant */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-semibold">
                      Total Stock for this Color *
                    </label>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Units available across all sizes
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={totalStock}
                    onChange={(e) => setTotalStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm px-3 py-2.5 outline-none text-right font-mono focus:border-black transition-colors"
                    placeholder="e.g. 50"
                  />
                  {errors.stock && <p className="text-xs text-red-600 font-mono">{errors.stock}</p>}
                  <p className="text-[10px] font-mono text-neutral-400">
                    One color variant will be created with all selected sizes as available options.
                  </p>
                </div>
              </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500">
                Product Images *
              </label>

              {/* Drag & drop upload */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-300 hover:border-neutral-500 bg-neutral-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFiles(e.target.files)}
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                />
                <span className="material-symbols-outlined text-3xl text-neutral-400 mb-2">
                  add_photo_alternate
                </span>
                <p className="text-xs text-neutral-800 uppercase tracking-wider font-mono">
                  Drag & Drop images or click to browse
                </p>
                <p className="text-[11px] text-neutral-400 font-mono mt-1">
                  Supports JPG, PNG, WEBP, AVIF
                </p>
              </div>

              {/* Direct URL input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={directUrlInput}
                  onChange={(e) => setDirectUrlInput(e.target.value)}
                  placeholder="Or paste an image URL..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs px-4 py-2.5 outline-none placeholder:text-neutral-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddDirectUrl}
                  className="px-4 py-2.5 border border-neutral-300 hover:border-black text-xs font-mono text-black transition-colors"
                >
                  + Add URL
                </button>
              </div>

              {errors.images && <p className="text-xs text-red-600 font-mono">{errors.images}</p>}

              {/* Image Previews */}
              {imagesList.length > 0 && (
                <div className="grid grid-cols-4 gap-3 pt-2">
                  {imagesList.map((img) => (
                    <div
                      key={img.id}
                      onClick={(e) => handleSetCover(img.id, e)}
                      className={`relative aspect-[4/5] bg-neutral-100 border cursor-pointer group overflow-hidden ${
                        img.isCover ? 'border-black ring-1 ring-black' : 'border-neutral-200'
                      }`}
                    >
                      <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                      {img.isCover && (
                        <span className="absolute top-1 left-1 bg-black text-white text-[9px] font-mono px-1 py-0.5">
                          COVER
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(img.id, e)}
                        className="absolute top-1 right-1 w-6 h-6 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seller Account Indicator */}
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>SELLER ID</span>
              <span className="text-neutral-700 font-medium">#{seller?._id || '6aa2e4dbe763976ef634087b'}</span>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black text-white hover:bg-neutral-800 text-xs uppercase tracking-wider font-medium py-3.5 px-6 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Product...' : 'Publish Product'}
              </button>

              <Link
                to="/seller/dashboard"
                className="px-6 py-3.5 border border-neutral-300 hover:border-black text-xs uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Real-time Preview (Right ~40%) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
              Live Preview
            </div>

            <article className="border border-neutral-200 bg-white overflow-hidden shadow-sm">
              <div className="aspect-[4/5] bg-neutral-100 relative overflow-hidden flex items-center justify-center">
                {primaryImage ? (
                  <img src={primaryImage} alt="Product Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-400">
                    <span className="material-symbols-outlined text-4xl mb-1">image</span>
                    <p className="text-xs font-mono">No Image Added</p>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-3">
                <div className="text-[11px] font-mono text-neutral-400 uppercase">
                  {category}
                </div>

                <h3 className="text-lg font-medium text-neutral-900 truncate">
                  {title.trim() || 'Product Title'}
                </h3>

                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed font-light">
                  {description.trim() || 'Your product description will appear here.'}
                </p>

                {/* Variant Previews */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">COLOR:</span>
                    <span className="font-bold text-neutral-900 uppercase">{activeColor || 'None'}</span>
                  </div>
                  <div className="text-neutral-500">
                    <span>{Number(totalStock) || 0} units</span>
                  </div>
                </div>

                {selectedSizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSizes.map((sz) => (
                      <span key={sz} className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {sz}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-150 flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400">PRICE</span>
                  <span className="text-xl font-light text-neutral-900 font-mono">
                    {parsedPrice > 0
                      ? new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: priceCurrency,
                          maximumFractionDigits: 0,
                        }).format(parsedPrice)
                      : '₹0'}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </form>
      </main>
    </div>
  )
}

export default CreateProduct