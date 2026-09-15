import React, { useState, useRef, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { useProduct } from '../hook/useProduct'

const CreateProduct = () => {
  const navigate = useNavigate()
  const { handleCreateProduct } = useProduct()
  const seller = useSelector((state) => state.auth.user)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceAmount, setPriceAmount] = useState('')
  const [priceCurrency, setPriceCurrency] = useState('INR')
  const [category, setCategory] = useState('Clothing')

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
      if (rawFiles.length > 0) {
        // FormData for multipart upload
        const fd = new FormData()
        fd.append('title', title.trim())
        fd.append('description', description.trim())
        fd.append('princeAmount', priceAmount)
        fd.append('priceCurrency', priceCurrency || 'INR')
        fd.append('seller', sellerId)

        rawFiles.forEach((file) => fd.append('images', file))
        urlStrings.forEach((url) => fd.append('images', url))

        await handleCreateProduct(fd)
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
        }

        try {
          await handleCreateProduct(payload)
        } catch (jsonErr) {
          const fd = new FormData()
          fd.append('title', title.trim())
          fd.append('description', description.trim())
          fd.append('priceAmount', priceAmount)
          fd.append('priceCurrency', priceCurrency || 'INR')
          
          fd.append('seller', sellerId)
          urlStrings.forEach((url) => fd.append('images', url))
          await handleCreateProduct(fd)
        }
      }

      setSuccessMessage('Product created successfully.')
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
