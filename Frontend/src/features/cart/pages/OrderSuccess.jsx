import React, { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { useCart } from '../hook/useCart'

// Fallback sample order in case user directly visits /order-success or refreshes
const DEFAULT_ORDER_DATA = {
  orderId: "SNITCH_ORD_" + Math.random().toString(36).substring(2, 9).toUpperCase(),
  paymentId: "pay_" + Math.random().toString(36).substring(2, 12),
  createdAt: new Date().toISOString(),
  items: [
    {
      _id: "sample_item_1",
      product: {
        _id: "6aace5bd43273cb7f5412ffe",
        title: "Relaxed Cuban Collar Linen Shirt",
        description: "Breathable airy pure linen blend tailored for warm days and evening outings.",
        images: [{ url: "https://ik.imagekit.io/uvkmtmuur/snitch/sh_mbXB4z1bw.jpg" }],
        variants: {
          attributes: { Size: "M" }
        }
      },
      size: "M",
      quantity: 1,
      price: { amount: 1100, currency: "INR" }
    }
  ],
  calculations: {
    subtotal: 1100,
    totalMrp: 1815,
    mrpDiscount: 715,
    couponDiscount: 0,
    shippingFee: 0,
    totalPayable: 1100,
    totalSavings: 715
  },
  pincode: "560001"
}

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { handleGetOrderDetails } = useCart()
  const user = useSelector((state) => state.auth?.user)

  const orderIdFromQuery = searchParams.get('order_id')
  const navState = location.state || {}

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)
  const [fetchedOrder, setFetchedOrder] = useState(null)

  // Trigger toast
  const triggerToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch backend order if orderId exists and not passed in state
  useEffect(() => {
    const fetchOrder = async () => {
      const orderIdToFetch = orderIdFromQuery || navState.orderId
      if (orderIdToFetch && !navState.orderData) {
        try {
          setLoading(true)
          const res = await handleGetOrderDetails(orderIdToFetch)
          if (res?.success && res?.order) {
            setFetchedOrder(res.order)
          }
        } catch (err) {
          console.warn("Could not fetch remote order:", err)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchOrder()
  }, [orderIdFromQuery, navState.orderId])

  // Derive consolidated order info
  const orderDetails = useMemo(() => {
    const orderId = orderIdFromQuery || navState.orderId || fetchedOrder?.razorpay?.orderId || DEFAULT_ORDER_DATA.orderId
    const paymentId = navState.paymentId || fetchedOrder?.razorpay?.paymentId || DEFAULT_ORDER_DATA.paymentId

    // Items consolidation
    let items = []
    if (fetchedOrder?.orderItems && fetchedOrder.orderItems.length > 0) {
      items = fetchedOrder.orderItems.map((item, idx) => ({
        _id: item._id || `order_item_${idx}`,
        product: {
          _id: item.productId,
          title: item.title,
          description: item.description,
          images: item.images || []
        },
        size: item.size || 'Standard',
        quantity: item.quantity || 1,
        price: item.price || { amount: 0, currency: 'INR' }
      }))
    } else if (navState.items && navState.items.length > 0) {
      items = navState.items
    } else {
      items = DEFAULT_ORDER_DATA.items
    }

    // Calculations
    const calculations = navState.calculations || {
      subtotal: fetchedOrder?.price?.amount || 1100,
      totalMrp: Math.round((fetchedOrder?.price?.amount || 1100) * 1.65),
      mrpDiscount: Math.round((fetchedOrder?.price?.amount || 1100) * 0.65),
      couponDiscount: 0,
      shippingFee: 0,
      totalPayable: fetchedOrder?.price?.amount || 1100,
      totalSavings: Math.round((fetchedOrder?.price?.amount || 1100) * 0.65)
    }

    const pincode = navState.pincode || "560001"

    // Estimated delivery calculation (4 business days from now)
    const today = new Date()
    const estDeliveryDate = new Date(today)
    estDeliveryDate.setDate(today.getDate() + 4)
    const formattedDelivery = estDeliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    return {
      orderId,
      paymentId,
      items,
      calculations,
      pincode,
      formattedDelivery,
      orderDate: today.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      orderTime: today.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }, [orderIdFromQuery, navState, fetchedOrder])

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderDetails.orderId)
    setCopied(true)
    triggerToast("Order Reference copied to clipboard!")
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-black selection:text-white font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 shadow-2xl flex items-center gap-3 border border-neutral-700 animate-fade-in">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs tracking-wider uppercase font-medium">{toast}</span>
        </div>
      )}

      {/* Top Notification Bar */}
      <div className="bg-black text-white py-2 px-4 text-center text-[11px] font-mono tracking-widest uppercase flex items-center justify-center gap-3 print:hidden">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          PAYMENT VERIFIED & ORDER CONFIRMED
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">TAMPER-PROOF DISPATCH GUARANTEED</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">24/7 SUPPORT AVAILABLE</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 print:static">
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
              Order Confirmation
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>

            <Link
              to="/"
              className="px-4 py-2 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Success Confirmation Card */}
        <div className="bg-white border border-neutral-200 p-6 sm:p-10 mb-8 shadow-xs relative overflow-hidden">
          {/* Subtle background luxury watermark */}
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-4 select-none font-black text-9xl tracking-tighter text-black flex items-center pr-6 overflow-hidden">
            CONFIRMED
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-100 pb-8">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Animated Success Badge */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 border-2 border-emerald-500/20 flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-none border border-emerald-300">
                    PAYMENT SUCCESSFUL
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {orderDetails.orderDate} at {orderDetails.orderTime}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
                  Thank You for Your Order{user?.fullname ? `, ${user.fullname.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                  Your order has been placed and is currently being processed by our express fulfillment team. An order confirmation invoice will be sent to{' '}
                  <strong className="text-neutral-900">{user?.email || 'your registered email'}</strong>.
                </p>
              </div>
            </div>

            {/* Quick Status / Estimated Delivery Highlight */}
            <div className="bg-neutral-50 border border-neutral-200 p-4 sm:p-5 min-w-[240px] shrink-0 text-left md:text-right">
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block">
                Estimated Delivery
              </span>
              <p className="text-base sm:text-lg font-bold text-neutral-900 mt-0.5 font-mono">
                {orderDetails.formattedDelivery}
              </p>
              <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1 mt-1">
                <span>⚡</span> Express Delivery by Snitch Logix
              </span>
            </div>
          </div>

          {/* Reference Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="bg-neutral-50/70 p-3.5 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Order ID</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {orderDetails.orderId}
                </span>
                <button
                  onClick={copyOrderId}
                  className="text-neutral-500 hover:text-black transition-colors shrink-0 p-1"
                  title="Copy Order ID"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-neutral-50/70 p-3.5 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Payment ID</span>
              <p className="font-mono text-xs sm:text-sm font-bold text-neutral-900 truncate mt-1">
                {orderDetails.paymentId}
              </p>
            </div>

            <div className="bg-neutral-50/70 p-3.5 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Payment Method</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs sm:text-sm font-bold text-neutral-900 uppercase">
                  Razorpay Secure UPI / Card
                </span>
              </div>
            </div>

            <div className="bg-neutral-50/70 p-3.5 border border-neutral-200/80">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Total Amount</span>
              <p className="font-mono text-sm sm:text-base font-bold text-neutral-900 mt-1">
                ₹{orderDetails.calculations.totalPayable.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Stepper Progress */}
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order & Shipment Progress
            </h2>
            <span className="text-[11px] font-mono text-neutral-500">
              Standard 2 - 4 Day Delivery
            </span>
          </div>

          <div className="relative">
            {/* Stepper Progress Bar */}
            <div className="hidden sm:block absolute top-1/2 left-0 w-full -translate-y-1/2 h-0.5 bg-neutral-200 z-0">
              <div className="h-full bg-emerald-600 transition-all duration-700 w-1/4"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
              {/* Step 1: Placed */}
              <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4 sm:gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md border-4 border-white">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-900 tracking-wider">Order Placed</h4>
                  <p className="text-[11px] font-mono text-emerald-600 font-medium">Completed</p>
                </div>
              </div>

              {/* Step 2: Quality Packing */}
              <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4 sm:gap-2">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-md border-4 border-white">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-900 tracking-wider">Processing</h4>
                  <p className="text-[11px] font-mono text-neutral-500">Packaging in warehouse</p>
                </div>
              </div>

              {/* Step 3: In Transit */}
              <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4 sm:gap-2">
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold text-xs border-4 border-white">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">In Transit</h4>
                  <p className="text-[11px] font-mono text-neutral-400">BlueDart / Delhivery</p>
                </div>
              </div>

              {/* Step 4: Delivered */}
              <div className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4 sm:gap-2">
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold text-xs border-4 border-white">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Delivered</h4>
                  <p className="text-[11px] font-mono text-neutral-400">{orderDetails.formattedDelivery}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Order Items & Delivery Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Ordered Items (7-8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                <h3 className="text-sm font-bold tracking-wider uppercase text-neutral-900 flex items-center gap-2">
                  <span>ITEMS IN THIS ORDER</span>
                  <span className="text-xs font-mono font-normal text-neutral-500">
                    ({orderDetails.items.length} {orderDetails.items.length === 1 ? 'PRODUCT' : 'PRODUCTS'})
                  </span>
                </h3>

                <span className="text-xs font-mono text-emerald-600 font-medium">
                  Verified Purchase
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100">
                {orderDetails.items.map((item, index) => {
                  const product = item.product || {}
                  const displayImage =
                    item.images?.[0]?.url ||
                    product.images?.[0]?.url ||
                    product.variants?.images?.[0]?.url ||
                    "https://ik.imagekit.io/uvkmtmuur/snitch/sh_mbXB4z1bw.jpg"

                  const size = item.size || product.variants?.attributes?.Size || product.variants?.attributes?.size || 'Free Size'
                  const unitPrice = item.price?.amount || product.variants?.price?.amount || product.price?.amount || 0
                  const originalMrp = Math.round(unitPrice * 1.65)

                  return (
                    <div key={item._id || index} className="py-4 sm:py-5 first:pt-0 last:pb-0 flex gap-4 sm:gap-6">
                      {/* Product Thumbnail */}
                      <div className="relative w-20 sm:w-24 aspect-3/4 bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200">
                        <img
                          src={displayImage}
                          alt={product.title}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
                                SNITCH APPAREL
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug truncate mt-0.5">
                                <Link to={product._id ? `/product/${product._id}` : '#'} className="hover:underline">
                                  {product.title}
                                </Link>
                              </h4>
                            </div>

                            <span className="text-sm font-bold font-mono text-neutral-900 shrink-0">
                              ₹{(unitPrice * (item.quantity || 1)).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {product.description && (
                            <p className="text-xs text-neutral-500 line-clamp-1 mt-1 font-light">
                              {product.description}
                            </p>
                          )}

                          {/* Attributes */}
                          <div className="flex flex-wrap items-center gap-3 mt-2.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-xs font-mono">
                              <span className="text-neutral-500 text-[10px]">SIZE:</span>
                              <strong className="text-neutral-900">{size}</strong>
                            </span>

                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-xs font-mono">
                              <span className="text-neutral-500 text-[10px]">QTY:</span>
                              <strong className="text-neutral-900">{item.quantity || 1}</strong>
                            </span>

                            {originalMrp > unitPrice && (
                              <span className="text-xs font-mono text-emerald-600 font-medium">
                                Saved ₹{((originalMrp - unitPrice) * (item.quantity || 1)).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-3 mt-2 border-t border-dashed border-neutral-100 text-xs">
                          <Link
                            to={product._id ? `/product/${product._id}` : '/'}
                            className="text-neutral-600 hover:text-black font-medium underline"
                          >
                            View Product
                          </Link>
                          <span className="text-neutral-300">•</span>
                          <span className="text-neutral-500 text-[11px]">
                            7-Day Doorstep Exchange Policy Applies
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Delivery & Customer Info Card */}
            <div className="bg-white border border-neutral-200 p-6 shadow-xs">
              <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 border-b border-neutral-200 pb-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                SHIPPING & DELIVERY ADDRESS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Delivering To</span>
                  <p className="font-bold text-neutral-900 text-sm">{user?.fullname || "Valued Customer"}</p>
                  <p className="text-neutral-600 mt-1 leading-relaxed">
                    Standard Express Doorstep Delivery<br />
                    PIN Code: <strong className="font-mono text-black">{orderDetails.pincode}</strong><br />
                    India
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Contact Details</span>
                  <p className="text-neutral-700">
                    Email: <span className="font-medium text-neutral-900">{user?.email || "Provided at checkout"}</span>
                  </p>
                  <p className="text-neutral-700 mt-1">
                    Phone: <span className="font-mono font-medium text-neutral-900">{user?.contact || "+91 98765 43210"}</span>
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 text-[11px] text-neutral-700">
                    <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>OTP required at the time of delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Price Breakdown & Next Steps (4-5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white border border-neutral-200 p-6 shadow-xs">
              <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 border-b border-neutral-200 pb-3 mb-4">
                PAYMENT SUMMARY
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Total MRP</span>
                  <span className="font-mono text-neutral-900">
                    ₹{orderDetails.calculations.totalMrp.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Bag Savings</span>
                  <span className="font-mono text-emerald-600">
                    -₹{orderDetails.calculations.mrpDiscount.toLocaleString('en-IN')}
                  </span>
                </div>

                {orderDetails.calculations.couponDiscount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Coupon Discount</span>
                    <span className="font-mono text-emerald-600">
                      -₹{orderDetails.calculations.couponDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>Shipping Fee</span>
                  <span className="font-mono text-emerald-600 font-bold uppercase">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Taxes & GST</span>
                  <span className="font-mono text-neutral-900">Included</span>
                </div>

                <div className="border-t border-neutral-200 pt-4 mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                      TOTAL PAID
                    </span>
                    <span className="text-xl font-bold font-mono text-neutral-900">
                      ₹{orderDetails.calculations.totalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-mono text-emerald-700 font-medium">
                      Paid via Razorpay Authorized Gateway
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Savings Callout */}
              {orderDetails.calculations.totalSavings > 0 && (
                <div className="mt-5 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-center text-xs font-medium">
                  🎉 Total Savings on this order: <strong className="font-mono font-bold">₹{orderDetails.calculations.totalSavings.toLocaleString('en-IN')}</strong>
                </div>
              )}

              {/* Primary Call To Actions */}
              <div className="mt-6 space-y-3">
                <Link
                  to="/"
                  className="w-full py-4 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>CONTINUE SHOPPING</span>
                  <span>→</span>
                </Link>

                <button
                  onClick={handlePrint}
                  className="w-full py-3 bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-bold tracking-wider uppercase hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download / Print Invoice</span>
                </button>
              </div>
            </div>

            {/* Snitch VIP Concierge & Assistance */}
            <div className="bg-neutral-100 border border-neutral-200 p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                    Snitch Concierge & Support
                  </h4>
                  <p className="text-[11px] text-neutral-500">Need modifications or have a question?</p>
                </div>
              </div>

              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Our support team is available 24/7 to assist with tracking, size alterations, or cancellation requests before dispatch.
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs">
                <a
                  href="mailto:support@snitch.co.in"
                  className="font-mono text-black font-bold uppercase underline hover:opacity-75"
                >
                  support@snitch.co.in
                </a>
                <span className="text-[11px] font-mono text-neutral-500">
                  Ref: {orderDetails.orderId.slice(-6)}
                </span>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="space-y-2 text-[11px] text-neutral-500 px-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>100% Original Products with Quality Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>7-Day Hassle-free Exchange & Doorstep Return</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Encrypted 256-Bit SSL Payment Verification</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-neutral-900 text-neutral-400 text-xs py-8 border-t border-neutral-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white tracking-[0.2em]">SNITCH</span>
            <span>•</span>
            <span>Style. Unfiltered.</span>
          </div>
          <p className="font-mono text-[11px] text-neutral-500">
            © {new Date().getFullYear()} SNITCH APPAREL LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  )
}
