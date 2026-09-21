import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { useProduct } from '../hook/useProduct'
import { useCart } from '../../cart/hook/useCart'

const FALLBACK_PRODUCT = {
  _id: "6aace5bd43273cb7f5412ffe",
  title: "Relaxed Cuban Collar Linen Shirt",
  description: "Breathable airy pure linen blend tailored for warm days and evening outings.",
  seller: "6aaba6b25b233ddf67ade5d8",
  price: {
    amount: 1100,
    currency: "INR",
  },
  images: [
    {
      url: "https://ik.imagekit.io/uvkmtmuur/snitch/sh_mbXB4z1bw.jpg",
      _id: "6aace5bd43273cb7f5412fff",
    },
    {
      url: "https://ik.imagekit.io/uvkmtmuur/snitch/shirt_Lgrc8iHWF.jpg",
      _id: "6aace5bd43273cb7f5413000",
    },
    {
      url: "https://ik.imagekit.io/uvkmtmuur/snitch/shrit_KbnWjeFQXT.jpg",
      _id: "6aace5bd43273cb7f5413001",
    },
  ],
  variants: [
    {
      _id: "6aace65a43273cb7f5413014",
      attributes: {
        Color: "Olive",
        Sizes: ["S", "M", "L", "XL"],
      },
      price: {
        amount: 1100,
        currency: "INR",
      },
      stock: 40,
      images: [
        {
          url: "https://ik.imagekit.io/uvkmtmuur/snitch/ATVQuQu9_92e49675cd2f478491c8822d2f66bdc7_l75a2refT.jpg",
          _id: "6aace65a43273cb7f5413015",
        },
        {
          url: "https://ik.imagekit.io/uvkmtmuur/snitch/gScr4sSR_d0ec5a4bd68c4eb188bc6ade80a935b1_8BOFbOTNF.jpg",
          _id: "6aace65a43273cb7f5413016",
        },
        {
          url: "https://ik.imagekit.io/uvkmtmuur/snitch/jXUB8jiM_85de043f361e454c9f3e310c7fb0a988_ZhukAJfLd.jpg",
          _id: "6aace65a43273cb7f5413017",
        },
      ],
    },
  ],
}

// Safely normalize variant attributes across Map, Object, and Key-Value array formats
const getVariantAttributes = (variant) => {
  if (!variant || !variant.attributes) return {}
  const raw = variant.attributes
  if (raw instanceof Map) {
    const obj = {}
    raw.forEach((val, key) => {
      obj[key] = String(val)
    })
    return obj
  }
  if (Array.isArray(raw)) {
    const obj = {}
    raw.forEach((item) => {
      if (item && item.key) obj[item.key] = String(item.value ?? '')
    })
    return obj
  }
  if (typeof raw === 'object') {
    return { ...raw }
  }
  return {}
}

// Case-insensitive attribute lookup with colour alias
const getAttributeValue = (attributes, targetKey) => {
  if (!attributes) return null
  const targetLower = targetKey.toLowerCase()
  for (const [k, v] of Object.entries(attributes)) {
    const kLower = k.toLowerCase()
    if (kLower === targetLower) {
      return String(v)
    }
    if (targetLower === 'color' && kLower === 'colour') {
      return String(v)
    }
  }
  return null
}

const ProductDetail = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { handleGetProudctById } = useProduct()
  const { handleAddItem } = useCart()
  const cartItems = useSelector((state) => state.cart?.items || [])

  const [productData, setProductData] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [pincode, setPincode] = useState('')
  const [pincodeChecked, setPincodeChecked] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

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

  // Active product source
  const product = productData || FALLBACK_PRODUCT
  const variants = product?.variants || []

  // ─── 1. Group Variants by Color ───────────────────────────────────────────
  // Each variant IS a color variant. Sizes live in variant.attributes.Sizes (array).
  const colorGroups = useMemo(() => {
    if (!variants || variants.length === 0) return []

    return variants.map((variant) => {
      const attrs = getVariantAttributes(variant)
      const rawColor = getAttributeValue(attrs, 'color')

      // Sizes is an array attribute: ['S', 'M', 'L', 'XL']
      let sizes = []
      const rawSizes = attrs['Sizes'] || attrs['sizes'] || attrs['Size'] || attrs['size'] || null
      if (Array.isArray(rawSizes)) {
        sizes = rawSizes.map(String)
      } else if (typeof rawSizes === 'string' && rawSizes.trim()) {
        // Fallback: single size stored as string
        sizes = [rawSizes.trim()]
      }

      // Images for this color variant
      let images = []
      if (Array.isArray(variant.images) && variant.images.length > 0) {
        images = variant.images.map((img) =>
          typeof img === 'object' ? img : { url: img }
        )
      } else if (Array.isArray(product?.images) && product.images.length > 0) {
        images = [...product.images]
      }

      return {
        colorName: rawColor || '',
        hasExplicitColor: Boolean(rawColor),
        variant,           // the actual DB variant document
        variants: [variant],
        images,
        sizes,             // array of available size strings for this color
        stock: Number(variant.stock) || 0,
      }
    })
  }, [variants, product])

  const hasColors = colorGroups.some((g) => g.hasExplicitColor)

  // ─── 2. All Unique Sizes Across Product ──────────────────────────────────
  // Sizes come from variant.attributes.Sizes (array) on each color variant
  const STANDARD_SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38', '40']
  const allProductSizes = useMemo(() => {
    const sizesSet = new Set()
    variants.forEach((v) => {
      const attrs = getVariantAttributes(v)
      // Check Sizes array attribute first
      const sizesAttr = attrs['Sizes'] || attrs['sizes']
      if (Array.isArray(sizesAttr)) {
        sizesAttr.forEach((s) => sizesSet.add(String(s).trim()))
      } else {
        // Legacy: single Size attribute per variant
        const size = getAttributeValue(attrs, 'size')
        if (size) sizesSet.add(size.trim())
      }
    })
    const list = Array.from(sizesSet)
    return list.sort((a, b) => {
      const idxA = STANDARD_SIZE_ORDER.indexOf(a.toUpperCase())
      const idxB = STANDARD_SIZE_ORDER.indexOf(b.toUpperCase())
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })
  }, [variants])

  const hasSizes = allProductSizes.length > 0

  // ─── 3. Auto-Select Default Color on Mount / Product Load ─────────────────
  useEffect(() => {
    if (colorGroups.length > 0) {
      const currentExists = colorGroups.some((g) => g.colorName === selectedColor)
      if (!selectedColor || !currentExists) {
        // Prefer first color with in-stock variants, otherwise first color
        const inStockGroup = colorGroups.find((g) =>
          g.variants.some((v) => (Number(v.stock) || 0) > 0)
        )
        const chosen = inStockGroup || colorGroups[0]
        setSelectedColor(chosen.colorName)
        setSelectedImageIndex(0)
      }
    } else {
      setSelectedColor(null)
    }
  }, [colorGroups])

  // Active color group
  const activeColorGroup = useMemo(() => {
    if (!colorGroups || colorGroups.length === 0) return null
    if (selectedColor) {
      return colorGroups.find((g) => g.colorName === selectedColor) || colorGroups[0]
    }
    return colorGroups[0]
  }, [colorGroups, selectedColor])

  // ─── 4. Exact Selected Variant Resolution ─────────────────────────────────
  // Variant = Color. Selecting a color directly selects that variant.
  // Size is a separate UI choice stored in selectedSize (not a separate variant).
  const selectedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null

    // If product has color variants, resolve by selected color
    if (hasColors) {
      const group = colorGroups.find((g) => g.colorName === selectedColor)
      return group?.variant || activeColorGroup?.variant || variants[0]
    }

    // No colors: just return the single variant (or first)
    return variants[0]
  }, [variants, hasColors, colorGroups, selectedColor, activeColorGroup])

  // ─── Color & Size Selection Handlers ─────────────────────────────────────
  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName)
    setSelectedImageIndex(0)
    setSizeError(false)
    // When switching color, clear size selection (new color may have different available sizes)
    setSelectedSize(null)
  }

  const handleSizeSelect = (sizeVal) => {
    // Sizes are attributes on the color variant — no per-size stock gating
    setSelectedSize((prev) => (prev === sizeVal ? null : sizeVal))
    setSizeError(false)
  }

  // ─── Gallery Images (Synchronized with Selected Color) ────────────────────
  const images = useMemo(() => {
    // 1. If product has distinct color variants, prioritize active color photoshoot
    if (hasColors && activeColorGroup?.images?.length > 0) {
      return activeColorGroup.images
    }
    // 2. If a specific variant is chosen and has dedicated images
    if (selectedVariant?.images?.length > 0) {
      return selectedVariant.images
    }
    // 3. Primary catalog images at the product level
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images
    }
    // 4. Variant images if product level images are not provided
    if (activeColorGroup?.images?.length > 0) {
      return activeColorGroup.images
    }
    return FALLBACK_PRODUCT.images
  }, [hasColors, activeColorGroup, selectedVariant, product])

  // ─── Currency & Pricing ──────────────────────────────────────────────────
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount ?? 0)
  }

  const currentPrice =
    selectedVariant?.price?.amount ??
    activeColorGroup?.variant?.price?.amount ??
    product?.price?.amount ??
    1100

  const currencyCode =
    selectedVariant?.price?.currency ??
    activeColorGroup?.variant?.price?.currency ??
    product?.price?.currency ??
    'INR'

  const originalPrice = Math.round(currentPrice * 1.8)
  const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)

  // Stock for current selection
  const selectedVariantStock = selectedVariant ? Number(selectedVariant.stock) ?? 0 : null

  // ─── Non-Color / Non-Size Attributes (Fit, Material, etc.) ────────────────
  const infoKeys = useMemo(() => {
    const keys = new Set()
    variants.forEach((v) => {
      const attrs = getVariantAttributes(v)
      Object.keys(attrs).forEach((k) => {
        const kLower = k.toLowerCase()
        // Exclude color, size, and sizes from the info display
        if (kLower !== 'color' && kLower !== 'colour' && kLower !== 'size' && kLower !== 'sizes') {
          keys.add(k)
        }
      })
    })
    return Array.from(keys)
  }, [variants])

  // ─── Total Cart Count ────────────────────────────────────────────────────
  const totalCartCount = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0
    return cartItems.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0)
  }, [cartItems])

  // ─── Add to Cart & Buy Now Handlers ──────────────────────────────────────
  const handleAddToCart = async () => {
    if (hasSizes && !selectedSize) {
      setSizeError(true)
      showToast('Please select a size first', 'error')
      return
    }

    if (hasColors && !selectedColor) {
      showToast('Please select a color', 'error')
      return
    }

    // selectedVariant is the color variant — check its overall stock
    if (selectedVariant && Number(selectedVariant.stock) <= 0) {
      showToast('This color is out of stock', 'error')
      return
    }

    const resolvedVariantId =
      selectedVariant?._id ||
      (variants.length === 1 ? variants[0]._id : undefined)

    try {
      setIsAdding(true)
      await handleAddItem({
        productId: product._id,
        variantId: resolvedVariantId,
        quantity,
        size: selectedSize || undefined,
      })
      const label = [selectedColor, selectedSize].filter(Boolean).join(' / ')
      showToast(`Added to Bag: ${product.title || 'Item'}${label ? ` (${label})` : ''}`, 'success')
    } catch (err) {
      console.error('Failed to add item to cart:', err)
      showToast('Failed to add to bag. Please try again.', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (hasSizes && !selectedSize) {
      setSizeError(true)
      showToast('Please select a size before buying', 'error')
      return
    }

    if (hasColors && !selectedColor) {
      showToast('Please select a color before buying', 'error')
      return
    }

    // selectedVariant is the color variant — check its overall stock
    if (selectedVariant && Number(selectedVariant.stock) <= 0) {
      showToast('This color is out of stock', 'error')
      return
    }

    const resolvedVariantId =
      selectedVariant?._id ||
      (variants.length === 1 ? variants[0]._id : undefined)

    try {
      setIsAdding(true)
      await handleAddItem({
        productId: product._id,
        variantId: resolvedVariantId,
        quantity,
        size: selectedSize || undefined,
      })
      navigate('/cart')
    } catch (err) {
      console.error('Failed to buy now:', err)
      showToast('Failed to proceed to checkout. Please try again.', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-black selection:text-white antialiased font-sans">
      {/* Top Announcement Bar */}
      <div className="bg-black text-white py-2 px-4 text-center text-[11px] font-mono tracking-widest uppercase flex items-center justify-center gap-3">
        <span>⚡ FREE EXPRESS SHIPPING ON ALL PRE-PAID ORDERS</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">USE CODE: FIRST10 FOR EXTRA 10% OFF</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Drops</span>
            </Link>
          </div>

          <Link
            to="/"
            className="text-2xl font-black tracking-[0.25em] text-neutral-950 hover:opacity-85 transition-opacity"
          >
            SNITCH
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              aria-label="Wishlist"
              className="p-2 text-neutral-600 hover:text-black transition-colors relative"
            >
              <svg
                className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-currentColor'}`}
                viewBox="0 0 24 24"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            <Link
              to="/cart"
              aria-label="Bag"
              className="p-2 text-neutral-600 hover:text-black transition-colors relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center space-x-2 text-xs text-neutral-500 font-medium">
          <li>
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
          </li>
          <li>/</li>
          <li>
            <span className="hover:text-black transition-colors cursor-pointer">Collection</span>
          </li>
          <li>/</li>
          <li className="text-black font-semibold truncate max-w-[200px] sm:max-w-xs">
            {product?.title || "Product Details"}
          </li>
        </ol>
      </nav>

      {/* Main Product Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ================= LEFT: PRODUCT MEDIA GALLERY ================= */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails Sidebar */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[620px] pb-2 md:pb-0 scrollbar-none shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img._id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-20 md:w-20 md:h-24 rounded-sm overflow-hidden border-2 transition-all shrink-0 bg-neutral-100 cursor-pointer ${selectedImageIndex === idx
                    ? 'border-black ring-1 ring-black/10'
                    : 'border-transparent hover:border-neutral-300 opacity-70 hover:opacity-100'
                    }`}
                >
                  <img
                    src={img.url}
                    alt={`${product?.title || 'Product'} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600"
                    }}
                  />
                  {selectedImageIndex === idx && (
                    <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="relative flex-1 bg-neutral-100 rounded-sm overflow-hidden aspect-[3/4] group">
              <img
                src={images[selectedImageIndex]?.url}
                alt={product?.title || 'Selected Product Image'}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=900"
                }}
              />

              {/* Tag / Badge */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-black text-white text-[10px] font-mono tracking-widest font-semibold px-2.5 py-1 uppercase shadow-sm">
                  NEW DROP
                </span>
                {discountPercent > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-mono tracking-widest font-semibold px-2.5 py-1 uppercase shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Button on Image */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Toggle Wishlist"
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-neutral-800 hover:bg-white transition-all shadow-sm hover:scale-110"
              >
                <svg
                  className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`}
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>

              {/* Image Index Indicator */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono px-2.5 py-1 rounded-full">
                {selectedImageIndex + 1} / {images.length}
              </div>

              {/* Previous / Next Arrow Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-neutral-900 shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-neutral-900 shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================= RIGHT: PRODUCT DETAILS & PURCHASE ================= */}
          <div className="lg:col-span-5 flex flex-col space-y-6">

            {/* Header: Brand & Title */}
            <div>
              <p className="text-xs font-mono font-medium uppercase tracking-widest text-neutral-400">
                SNITCH APPAREL / STUDIO
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight uppercase mt-1">
                {product?.title || 'Oversized Heavyweight Tee'}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-semibold text-neutral-800">4.9</span>
                <span className="text-neutral-400 text-xs">|</span>
                <span className="text-xs text-neutral-500 underline underline-offset-2 cursor-pointer hover:text-black">
                  128 Verified Ratings
                </span>
              </div>
            </div>

            {/* Price block */}
            <div className="border-y border-neutral-100 py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-black tracking-tight">
                  {formatCurrency(currentPrice, currencyCode)}
                </span>
                <span className="text-base text-neutral-400 line-through font-medium">
                  {formatCurrency(originalPrice, currencyCode)}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                  {discountPercent}% OFF
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 font-medium">
                Inclusive of all taxes. Free shipping on this item.
              </p>
            </div>

            {/* ═══════════════ COLOR & SIZE VARIANT SELECTOR ═══════════════ */}
            {variants.length > 0 && (
              <div className="space-y-5">

                {/* ── COLOR: Categorized image thumbnail swatches ── */}
                {hasColors && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">
                      Color
                      {selectedColor && (
                        <span className="ml-1.5 text-neutral-900 normal-case font-bold tracking-normal">
                          — {selectedColor}
                        </span>
                      )}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {colorGroups.map((group) => {
                        const isSelected = selectedColor === group.colorName
                        const thumbUrl =
                          group.images?.[0]?.url ||
                          group.variants?.[0]?.images?.[0]?.url ||
                          group.variants?.[0]?.images?.[0]
                        const hasStock = group.stock > 0

                        return (
                          <button
                            key={group.colorName}
                            type="button"
                            onClick={() => handleColorSelect(group.colorName)}
                            title={group.colorName}
                            className={`relative flex flex-col items-center gap-1.5 group cursor-pointer ${
                              !hasStock ? 'opacity-60' : ''
                            }`}
                          >
                            {/* Thumbnail frame */}
                            <span
                              className={`block w-16 h-20 rounded overflow-hidden border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-black shadow-md ring-2 ring-black/10'
                                  : 'border-neutral-200 hover:border-neutral-400'
                              }`}
                            >
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={group.colorName}
                                  className="w-full h-full object-cover object-center"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <span className="w-full h-full bg-neutral-100 flex items-center justify-center text-[11px] font-mono font-bold text-neutral-600">
                                  {group.colorName?.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </span>
                            {/* Color label */}
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                                isSelected ? 'text-black font-bold' : 'text-neutral-500 group-hover:text-neutral-800'
                              }`}
                            >
                              {group.colorName}
                            </span>
                            {/* Selected tick badge */}
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center shadow">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── SIZE: Available sizes for the active color ── */}
                {hasSizes && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className={`text-[11px] font-semibold uppercase tracking-widest ${sizeError ? 'text-red-600 font-bold' : 'text-neutral-500'}`}>
                          Size
                          {selectedSize && (
                            <span className="ml-1.5 text-neutral-900 normal-case font-bold tracking-normal">
                              — {selectedSize}
                            </span>
                          )}
                        </p>
                        {sizeError && (
                          <span className="text-[10px] font-bold text-red-600 animate-pulse">
                            (Please select a size)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSizeGuide(true)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-black underline underline-offset-2 transition-colors uppercase tracking-wider"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Size Chart
                      </button>
                    </div>

                    <div className={`flex flex-wrap gap-2.5 ${sizeError ? 'p-2 border border-red-300 rounded bg-red-50/40' : ''}`}>
                      {/* Sizes from the active color variant's Sizes attribute array */}
                      {(() => {
                        // Available sizes for the currently selected color variant
                        const availableSizes = activeColorGroup?.sizes?.length > 0
                          ? activeColorGroup.sizes
                          : allProductSizes
                        return availableSizes.map((sizeVal) => {
                          const isSelected = selectedSize === sizeVal
                          return (
                            <button
                              key={sizeVal}
                              type="button"
                              onClick={() => handleSizeSelect(sizeVal)}
                              title={sizeVal}
                              className={`relative min-w-[54px] h-[46px] px-3.5 text-sm font-bold tracking-wider uppercase border-2 transition-all duration-150 rounded ${
                                isSelected
                                  ? 'border-black bg-black text-white shadow-sm'
                                  : 'border-neutral-300 bg-white text-neutral-800 hover:border-black hover:text-black cursor-pointer'
                              }`}
                            >
                              {sizeVal}
                            </button>
                          )
                        })
                      })()}
                    </div>
                  </div>
                )}

                {/* ── INFO-ONLY ATTRIBUTES (Fit, Material, etc.) ── */}
                {infoKeys.length > 0 && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 py-3 border-t border-neutral-100">
                    {infoKeys.map((key) => {
                      const val =
                        getAttributeValue(getVariantAttributes(selectedVariant), key) ??
                        getAttributeValue(getVariantAttributes(activeColorGroup?.variants?.[0]), key) ??
                        getAttributeValue(getVariantAttributes(variants[0]), key)
                      if (!val) return null
                      return (
                        <div key={key}>
                          <span className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">{key}</span>
                          <span className="text-xs font-semibold text-neutral-800">{val}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── STOCK STATUS PILL ── */}
                {selectedVariant ? (
                  selectedVariantStock !== null && selectedVariantStock <= 5 ? (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      Only <strong className="ml-0.5">{selectedVariantStock} left</strong>&nbsp;— grab it fast!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      In stock&nbsp;·&nbsp;<strong>{selectedVariantStock ?? 'Available'} units</strong>
                    </div>
                  )
                ) : hasSizes && !selectedSize ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-2 rounded">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0"></span>
                    Select a size to view real-time stock & dispatch details
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    In stock&nbsp;·&nbsp;Ready to dispatch
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Quantity
              </span>
              <div className="flex items-center border border-neutral-300 rounded-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono font-semibold text-xs text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* ================= PRIMARY ACTION BUTTONS ================= */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ADD TO CART BUTTON */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  type="button"
                  className={`w-full py-3.5 px-6 border-2 border-black text-black bg-white hover:bg-neutral-900 hover:text-white transition-all duration-200 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] cursor-pointer ${
                    isAdding ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span>{isAdding ? 'ADDING...' : 'ADD TO CART'}</span>
                </button>

                {/* BUY NOW BUTTON */}
                <button
                  onClick={handleBuyNow}
                  disabled={isAdding}
                  type="button"
                  className={`w-full py-3.5 px-6 bg-black text-white hover:bg-neutral-800 transition-all duration-200 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer ${
                    isAdding ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>BUY NOW</span>
                </button>
              </div>

              {/* Wishlist full width secondary link */}
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="w-full py-2.5 border border-neutral-200 text-neutral-600 hover:text-black hover:border-black transition-all text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`}
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{isWishlisted ? 'SAVED TO WISHLIST' : 'SAVE TO WISHLIST'}</span>
              </button>
            </div>

            {/* Delivery Pincode Checker */}
            <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Delivery Options
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''))
                    setPincodeChecked(false)
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-black font-mono"
                />
                <button
                  type="button"
                  onClick={() => pincode.length === 6 && setPincodeChecked(true)}
                  disabled={pincode.length !== 6}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition-colors"
                >
                  Check
                </button>
              </div>

              {pincodeChecked && (
                <div className="mt-3 text-xs text-emerald-700 flex items-start gap-1.5 font-medium animate-fadeIn">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Eligible for <strong>Express Delivery</strong>. Arriving in 2-3 business days.</span>
                </div>
              )}
            </div>

            {/* Brand Assurance Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 border border-neutral-100 bg-neutral-50/50 rounded-sm">
                <svg className="w-5 h-5 text-neutral-800 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div className="text-[11px]">
                  <p className="font-bold text-neutral-900 leading-tight">7-Day Return</p>
                  <p className="text-neutral-500 leading-tight">Hassle-free doorstep pickup</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 border border-neutral-100 bg-neutral-50/50 rounded-sm">
                <svg className="w-5 h-5 text-neutral-800 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-[11px]">
                  <p className="font-bold text-neutral-900 leading-tight">100% Authentic</p>
                  <p className="text-neutral-500 leading-tight">Certified Snitch Craft</p>
                </div>
              </div>
            </div>

            {/* Accordion / Info Tabs */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex border-b border-neutral-200 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setActiveTab('description')}
                  className={`pb-2.5 mr-6 transition-colors border-b-2 ${activeTab === 'description'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                    }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 mr-6 transition-colors border-b-2 ${activeTab === 'details'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                    }`}
                >
                  Fit & Specs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-2.5 transition-colors border-b-2 ${activeTab === 'shipping'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                    }`}
                >
                  Shipping & Returns
                </button>
              </div>

              <div className="py-4 text-xs text-neutral-600 leading-relaxed">
                {activeTab === 'description' && (
                  <div className="space-y-2">
                    <p className="text-neutral-800 font-medium">
                      {product?.description || "Engineered for unmatched comfort with an edgy, structured streetwear look. Crafted from heavy-gauge luxury cotton."}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-neutral-600 pt-2">
                      <li>Signature drop shoulder fit with relaxed drape</li>
                      <li>High-density screenprint and custom hardware</li>
                      <li>Reinforced collar ribbing to prevent stretching</li>
                      <li>Pre-washed fabric to avoid shrinkage after washing</li>
                    </ul>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-mono">Fabric</span>
                      <span className="font-semibold text-neutral-900">100% Combed Cotton (280 GSM)</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-mono">Fit</span>
                      <span className="font-semibold text-neutral-900">Relaxed / Oversized Silhouette</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-mono">Wash Care</span>
                      <span className="font-semibold text-neutral-900">Machine wash cold inside-out</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-mono">Country of Origin</span>
                      <span className="font-semibold text-neutral-900">India</span>
                    </div>
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="space-y-2">
                    <p>Standard delivery takes 3-5 business days depending on destination.</p>
                    <p>Free doorstep returns and size replacements within 7 days of delivery.</p>
                    <p>Cash on Delivery (COD) available across 18,000+ pin codes.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal: Size Guide */}
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-2xl relative animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <h3 className="font-bold text-sm uppercase tracking-wider text-black">
                  Size Guide (Inches)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="text-neutral-400 hover:text-black text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="py-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-mono text-[11px]">
                      <th className="py-2">SIZE</th>
                      <th className="py-2">CHEST</th>
                      <th className="py-2">LENGTH</th>
                      <th className="py-2">SHOULDER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800">
                    <tr><td className="py-2.5 font-bold">S</td><td>38</td><td>28</td><td>19.5</td></tr>
                    <tr><td className="py-2.5 font-bold">M</td><td>40</td><td>29</td><td>20.5</td></tr>
                    <tr><td className="py-2.5 font-bold">L</td><td>42</td><td>30</td><td>21.5</td></tr>
                    <tr><td className="py-2.5 font-bold">XL</td><td>44</td><td>31</td><td>22.5</td></tr>
                    <tr><td className="py-2.5 font-bold">XXL</td><td>46</td><td>32</td><td>23.5</td></tr>
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="w-full py-2.5 bg-black text-white text-xs font-bold tracking-wider uppercase"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded shadow-2xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition-all duration-300 ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-black text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
