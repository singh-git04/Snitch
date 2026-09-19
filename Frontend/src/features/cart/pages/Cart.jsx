import React, { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { useCart } from '../hook/useCart'
import { setItems } from '../state/cart.slice'

// Initial fallback/sample data matching the user's provided structure
const DEFAULT_CART_ITEMS = [
  {
    product: {
      _id: "6aace5bd43273cb7f5412ffe",
      title: "Relaxed Cuban Collar Linen Shirt",
      description: "Breathable airy pure linen blend tailored for warm days and evening outings.",
      seller: "6aaba6b25b233ddf67ade5d8",
      price: {
        amount: 1100,
        currency: "INR"
      },
      images: [
        {
          url: "https://ik.imagekit.io/uvkmtmuur/snitch/sh_mbXB4z1bw.jpg",
          _id: "6aace5bd43273cb7f5412fff"
        },
        {
          url: "https://ik.imagekit.io/uvkmtmuur/snitch/shirt_Lgrc8iHWF.jpg",
          _id: "6aace5bd43273cb7f5413000"
        },
        {
          url: "https://ik.imagekit.io/uvkmtmuur/snitch/shrit_KbnWjeFQXT.jpg",
          _id: "6aace5bd43273cb7f5413001"
        }
      ],
      variants: [
        {
          images: [
            {
              url: "https://ik.imagekit.io/uvkmtmuur/snitch/ATVQuQu9_92e49675cd2f478491c8822d2f66bdc7_l75a2refT.jpg",
              _id: "6aace65a43273cb7f5413015"
            },
            {
              url: "https://ik.imagekit.io/uvkmtmuur/snitch/gScr4sSR_d0ec5a4bd68c4eb188bc6ade80a935b1_8BOFbOTNF.jpg",
              _id: "6aace65a43273cb7f5413016"
            },
            {
              url: "https://ik.imagekit.io/uvkmtmuur/snitch/jXUB8jiM_85de043f361e454c9f3e310c7fb0a988_ZhukAJfLd.jpg",
              _id: "6aace65a43273cb7f5413017"
            }
          ],
          stock: 10,
          attributes: {
            Size: "XS"
          },
          price: {
            amount: 1100,
            currency: "INR"
          },
          _id: "6aace65a43273cb7f5413014"
        }
      ],
      createdAt: "2026-09-18T07:18:21.935Z",
      updatedAt: "2026-09-18T07:20:58.846Z",
      __v: 1
    },
    variant: "6aace65a43273cb7f5413014",
    quantity: 1,
    price: {
      amount: 1100,
      currency: "INR"
    },
    _id: "6aad924f2686a32e95a6e393"
  }
]

const Cart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const reduxCartItems = useSelector((state) => state.cart?.items)
  const { handleGetCart,handleIncrementCartItem } = useCart()

  // Local state for immediate responsiveness and offline support
  const [items, setLocalItems] = useState([])
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [toast, setToast] = useState(null)
  const [pincode, setPincode] = useState("560001")
  const [isChangingPin, setIsChangingPin] = useState(false)
  const [pincodeInput, setPincodeInput] = useState("")

  // Fetch cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        await handleGetCart()
      } catch (err) {
        console.warn("Could not fetch backend cart, using initial items:", err)
      }
    }
    fetchCart()
  }, [])

  // Sync Redux items to local state (with fallback to provided sample data)
  useEffect(() => {
    if (reduxCartItems && reduxCartItems.length > 0) {
      setLocalItems(reduxCartItems)
    } else if (items.length === 0) {
      setLocalItems(DEFAULT_CART_ITEMS)
    }
  }, [reduxCartItems])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }
console.log(reduxCartItems)
  // Quantity updates
  const handleQuantityChange = (itemId, delta) => {
    setLocalItems((prev) =>
      prev
        .map((item) => {
          if (item._id === itemId) {
            const newQty = item.quantity + delta
            if (newQty < 1) return null
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Remove item
  const handleRemoveItem = (itemId, productTitle) => {
    setLocalItems((prev) => prev.filter((item) => item._id !== itemId))
    showToast(`Removed "${productTitle || 'item'}" from your bag`)
  }

  // Coupon handling
  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase()
    setCouponError("")

    if (code === "SNITCHFIRST") {
      setAppliedCoupon({ code: "SNITCHFIRST", discount: 200, type: "fixed" })
      setCouponCode("")
      showToast("Coupon 'SNITCHFIRST' applied: ₹200 OFF")
    } else if (code === "SNITCH10") {
      setAppliedCoupon({ code: "SNITCH10", discount: 0.1, type: "percent" })
      setCouponCode("")
      showToast("Coupon 'SNITCH10' applied: 10% OFF")
    } else {
      setCouponError("Invalid coupon code. Try SNITCHFIRST or SNITCH10")
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError("")
    showToast("Coupon removed")
  }

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const price = item.price?.amount || item.product?.price?.amount || 0
      return acc + price * (item.quantity || 1)
    }, 0)

    // Original MRP benchmark (estimated 40% markup for display savings)
    const totalMrp = items.reduce((acc, item) => {
      const price = item.price?.amount || item.product?.price?.amount || 0
      const mrp = Math.round(price * 1.65)
      return acc + mrp * (item.quantity || 1)
    }, 0)

    const mrpDiscount = totalMrp - subtotal

    let couponDiscount = 0
    if (appliedCoupon) {
      if (appliedCoupon.type === "fixed") {
        couponDiscount = Math.min(appliedCoupon.discount, subtotal)
      } else if (appliedCoupon.type === "percent") {
        couponDiscount = Math.round(subtotal * appliedCoupon.discount)
      }
    }

    const freeShippingThreshold = 999
    const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99
    const totalPayable = Math.max(0, subtotal - couponDiscount + shippingFee)
    const totalSavings = mrpDiscount + couponDiscount + (subtotal >= freeShippingThreshold ? 99 : 0)

    return {
      subtotal,
      totalMrp,
      mrpDiscount,
      couponDiscount,
      shippingFee,
      totalPayable,
      totalSavings,
      freeShippingThreshold,
      awayFromFreeShipping: Math.max(0, freeShippingThreshold - subtotal)
    }
  }, [items, appliedCoupon])

  const totalItemCount = items.reduce((acc, i) => acc + (i.quantity || 1), 0)

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-black selection:text-white font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-none shadow-2xl flex items-center gap-3 border border-neutral-700 animate-bounce">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs tracking-wider uppercase font-medium">{toast}</span>
        </div>
      )}

      {/* Promo Announcement Banner */}
      <div className="bg-black text-white py-2 px-4 text-center text-[11px] font-mono tracking-widest uppercase flex items-center justify-center gap-3">
        <span>⚡ FREE EXPRESS DELIVERY ON ORDERS OVER ₹999</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">USE CODE: SNITCHFIRST FOR ₹200 OFF</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">7-DAY EASY DOORSTEP RETURNS</span>
      </div>

      {/* Cart Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-2xl font-bold tracking-[0.25em] text-black hover:opacity-80 transition-opacity"
            >
              SNITCH
            </Link>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium hidden sm:inline">
              Shopping Bag
            </span>
          </div>

          {/* Checkout Steps Indicator */}
          <div className="hidden md:flex items-center gap-3 text-xs tracking-wider uppercase">
            <span className="font-bold text-black border-b-2 border-black pb-0.5">1. Bag</span>
            <span className="text-neutral-300">———</span>
            <span className="text-neutral-400">2. Address</span>
            <span className="text-neutral-300">———</span>
            <span className="text-neutral-400">3. Payment</span>
          </div>

          {/* Secure Assurance */}
          <div className="flex items-center gap-2 text-neutral-600 text-xs tracking-wide">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline font-mono uppercase text-[11px]">100% SECURE CHECKOUT</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {items.length === 0 ? (
          /* Empty Bag State */
          <div className="max-w-md mx-auto py-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
              <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2 uppercase">
              YOUR BAG IS EMPTY
            </h2>
            <p className="text-sm text-neutral-500 mb-8 max-w-sm mx-auto leading-relaxed">
              There is nothing in your bag right now. Explore our latest luxury streetwear drops and elevate your wardrobe.
            </p>
            <Link
              to="/"
              className="inline-block w-full sm:w-auto px-8 py-4 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-lg"
            >
              EXPLORE LATEST DROPS
            </Link>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Items & Delivery Details (8 Cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Header with Item Count and Free Shipping Meter */}
              <div className="bg-white border border-neutral-200 p-5 rounded-none shadow-xs">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                  <h1 className="text-lg font-bold tracking-wider uppercase text-neutral-900 flex items-center gap-2">
                    MY BAG
                    <span className="text-xs font-mono font-normal text-neutral-500">
                      ({totalItemCount} {totalItemCount === 1 ? 'ITEM' : 'ITEMS'})
                    </span>
                  </h1>

                  {/* Delivery Location Pincode */}
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {isChangingPin ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Pincode"
                          value={pincodeInput}
                          onChange={(e) => setPincodeInput(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-neutral-300 font-mono focus:outline-black"
                        />
                        <button
                          onClick={() => {
                            if (pincodeInput.length === 6) {
                              setPincode(pincodeInput)
                              setIsChangingPin(false)
                              showToast(`Delivery location set to ${pincodeInput}`)
                            }
                          }}
                          className="text-xs font-bold uppercase underline hover:text-neutral-700"
                        >
                          Check
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <span>Deliver to: <strong className="font-mono text-neutral-900">{pincode}</strong></span>
                        <button
                          onClick={() => {
                            setPincodeInput(pincode)
                            setIsChangingPin(true)
                          }}
                          className="text-neutral-400 hover:text-black uppercase font-bold text-[10px] tracking-wider ml-1 underline"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Free Shipping Alert Banner */}
                {calculations.awayFromFreeShipping > 0 ? (
                  <div className="bg-neutral-50 p-3 border border-neutral-200/80 flex items-center justify-between text-xs">
                    <span className="text-neutral-700 font-medium">
                      Add <strong className="font-mono text-black">₹{calculations.awayFromFreeShipping}</strong> more to unlock <span className="text-emerald-600 font-bold uppercase">FREE EXPRESS DELIVERY</span>
                    </span>
                    <Link to="/" className="text-xs font-bold uppercase underline tracking-wider hover:text-neutral-600">
                      Shop More
                    </Link>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3 text-xs flex items-center gap-2 font-medium">
                    <span className="text-base">🚀</span>
                    <span>Congratulations! You've unlocked <strong className="font-bold">FREE EXPRESS DELIVERY</strong> on this order.</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => {
                  const product = item.product || {}
                  // Find matching variant details (size, variant specific image, stock)
                  const variantId = typeof item.variant === 'object' ? item.variant?._id : item.variant
                  const matchedVariant = product.variants?.find((v) => v._id === variantId) || product.variants?.[0]

                  // Selected attributes
                  const size = matchedVariant?.attributes?.Size || matchedVariant?.attributes?.size || 'Free Size'
                  const inStock = matchedVariant?.stock !== undefined ? matchedVariant.stock > 0 : true
                  const stockLeft = matchedVariant?.stock ?? 10

                  // Image prioritisation: variant images -> product images -> fallback
                  const displayImage =
                    matchedVariant?.images?.[0]?.url ||
                    product.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=900"

                  const unitPrice = item.price?.amount || matchedVariant?.price?.amount || product.price?.amount || 0
                  const currency = item.price?.currency || product.price?.currency || 'INR'
                  const originalMrp = Math.round(unitPrice * 1.65)
                  const discountPercent = Math.round(((originalMrp - unitPrice) / originalMrp) * 100)

                  return (
                    <div
                      key={item._id}
                      className="bg-white border border-neutral-200 p-4 sm:p-6 transition-all hover:border-neutral-300 shadow-xs relative"
                    >
                      <div className="flex gap-4 sm:gap-6">
                        {/* Product Thumbnail */}
                        <div className="relative w-24 sm:w-32 aspect-3/4 bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200">
                          <Link to={`/product/${product._id}`}>
                            <img
                              src={displayImage}
                              alt={product.title}
                              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                          {discountPercent > 0 && (
                            <span className="absolute top-1 left-1 bg-black text-white text-[9px] font-mono px-1.5 py-0.5 tracking-wider font-bold">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {/* Details & Controls */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            {/* Brand Tag & Remove Button */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-medium">
                                  SNITCH APPAREL
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug truncate mt-0.5">
                                  <Link to={`/product/${product._id}`} className="hover:underline">
                                    {product.title}
                                  </Link>
                                </h3>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(item._id, product.title)}
                                className="text-neutral-400 hover:text-red-600 transition-colors p-1 -mr-1"
                                title="Remove Item"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>

                            {/* Product Short Description */}
                            {product.description && (
                              <p className="text-xs text-neutral-500 line-clamp-1 mt-1 font-light">
                                {product.description}
                              </p>
                            )}

                            {/* Attributes Pills */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200 text-xs font-mono">
                                <span className="text-neutral-500 text-[11px]">SIZE:</span>
                                <span className="font-bold text-neutral-900">{size}</span>
                              </div>

                              {stockLeft <= 10 && stockLeft > 0 && (
                                <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                                  Only {stockLeft} left
                                </span>
                              )}
                              {!inStock && (
                                <span className="text-[11px] font-mono text-red-700 bg-red-50 px-2 py-0.5 border border-red-200">
                                  Out of Stock
                                </span>
                              )}
                            </div>

                            {/* Price Tag */}
                            <div className="flex items-baseline gap-2 mt-3">
                              <span className="text-base sm:text-lg font-bold font-mono text-neutral-900">
                                ₹{unitPrice.toLocaleString('en-IN')}
                              </span>
                              {originalMrp > unitPrice && (
                                <span className="text-xs font-mono text-neutral-400 line-through">
                                  ₹{originalMrp.toLocaleString('en-IN')}
                                </span>
                              )}
                              <span className="text-xs font-medium text-emerald-600">
                                Save ₹{((originalMrp - unitPrice) * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Quantity & Actions Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-3 border-t border-neutral-100">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-neutral-300 bg-neutral-50">
                              <button
                                onClick={() => handleQuantityChange(item._id, -1)}
                                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 transition-colors font-bold text-sm"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="w-10 text-center font-mono font-bold text-xs text-neutral-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleIncrementCartItem({productId: product._id, variantId})}
                                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 transition-colors font-bold text-sm"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Subtotal for this item & Wishlist Link */}
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => {
                                  showToast(`"${product.title}" saved for later`)
                                  handleRemoveItem(item._id, product.title)
                                }}
                                className="text-xs uppercase font-medium tracking-wider text-neutral-500 hover:text-black underline transition-colors"
                              >
                                Save for Later
                              </button>
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-mono text-neutral-400 block leading-none">
                                  Item Total
                                </span>
                                <span className="text-sm font-bold font-mono text-neutral-900">
                                  ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assurance Micro-Badge */}
                      <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span><strong>7 Days</strong> Easy Exchange / Return</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Estimated Delivery: <strong>2 - 4 Business Days</strong></span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Continue Shopping CTA Link */}
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-800 hover:text-black group transition-colors"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Continue Shopping More Styles</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Coupons, Price Breakdown & Checkout (4-5 Cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Coupon Box */}
              <div className="bg-white border border-neutral-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wider uppercase text-neutral-900 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    COUPONS & OFFERS
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-bold">
                      APPLIED
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="bg-neutral-50 border border-neutral-200 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold font-mono text-black">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        {appliedCoupon.type === 'fixed' ? `₹${appliedCoupon.discount} OFF Savings applied` : `${appliedCoupon.discount * 100}% OFF applied`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs uppercase font-bold tracking-wider text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          setCouponError("")
                        }}
                        className="flex-1 px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-mono uppercase focus:outline-black focus:bg-white"
                      />
                      <button
                        onClick={() => handleApplyCoupon()}
                        className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                      >
                        APPLY
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-red-600 mt-2 font-mono">{couponError}</p>
                    )}

                    {/* Quick Select Coupon Pills */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleApplyCoupon("SNITCHFIRST")}
                        className="text-[10px] font-mono border border-dashed border-neutral-300 bg-neutral-50 hover:border-black px-2 py-1 text-neutral-700 text-left transition-colors"
                      >
                        <strong>SNITCHFIRST</strong> (Flat ₹200 OFF)
                      </button>
                      <button
                        onClick={() => handleApplyCoupon("SNITCH10")}
                        className="text-[10px] font-mono border border-dashed border-neutral-300 bg-neutral-50 hover:border-black px-2 py-1 text-neutral-700 text-left transition-colors"
                      >
                        <strong>SNITCH10</strong> (10% OFF)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Breakdown */}
              <div className="bg-white border border-neutral-200 p-6 shadow-xs">
                <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-900 border-b border-neutral-200 pb-3 mb-4">
                  PRICE DETAILS ({totalItemCount} {totalItemCount === 1 ? 'ITEM' : 'ITEMS'})
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Total MRP</span>
                    <span className="font-mono text-neutral-900">
                      ₹{calculations.totalMrp.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Bag Discount</span>
                    <span className="font-mono text-emerald-600">
                      -₹{calculations.mrpDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-mono text-emerald-600">
                        -₹{calculations.couponDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-600">
                    <span>Estimated Shipping</span>
                    <span className="font-mono">
                      {calculations.shippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold uppercase">FREE</span>
                      ) : (
                        `₹${calculations.shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Convenience / Platform Fee</span>
                    <span className="font-mono text-emerald-600 font-bold uppercase">FREE</span>
                  </div>

                  <div className="border-t border-neutral-200 pt-4 mt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                        TOTAL AMOUNT
                      </span>
                      <span className="text-xl font-bold font-mono text-neutral-900">
                        ₹{calculations.totalPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Inclusive of all taxes & GST</p>
                  </div>
                </div>

                {/* Savings Banner */}
                {calculations.totalSavings > 0 && (
                  <div className="mt-4 p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-center text-xs font-medium">
                    You are saving <strong className="font-mono font-bold">₹{calculations.totalSavings.toLocaleString('en-IN')}</strong> on this purchase!
                  </div>
                )}

                {/* Checkout CTA */}
                <button
                  onClick={() => {
                    showToast("Redirecting to checkout...")
                  }}
                  className="w-full mt-5 py-4 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <span>→</span>
                </button>

                {/* Trust & Guarantee Notes */}
                <div className="mt-6 pt-5 border-t border-neutral-100 space-y-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>100% Original Products Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Secure Payments: UPI, Cards & Cash on Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Express Dispatch within 24 Hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  )
}

export default Cart
