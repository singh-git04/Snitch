import React, { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { Link, useNavigate } from "react-router"
import { useProduct } from "../hook/useProduct"


// Fallback products in case backend has no items or is loading initially,
// ensuring the user immediately sees working products including their sample item
const DEMO_PRODUCTS = [
  {
    _id: "6aa82525696b14ecf90065e5",
    title: "Oversized Heavyweight Tee",
    description: "280 GSM premium combed cotton drop-shoulder streetwear tee with relaxed silhouette.",
    price: {
      amount: 999,
      currency: "INR",
    },
    seller: "6aa2e4dbe763976ef634087b",
    images: [
      {
        url: "https://ik.imagekit.io/uvkmtmuur/snitch/photo_SbARopyV4.png",
        _id: "6aa82525696b14ecf90065e6",
      },
    ],
    category: "tees",
    tag: "NEW DROP",
    createdAt: "2026-09-14T16:47:33.890Z",
  },
  {
    _id: "6aa82525696b14ecf90065e7",
    title: "Relaxed Cuban Collar Linen Shirt",
    description: "Breathable airy pure linen blend tailored for warm days and evening outings.",
    price: {
      amount: 1499,
      currency: "INR",
    },
    seller: "6aa2e4dbe763976ef634087b",
    images: [
      {
        url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=900",
        _id: "img_2",
      },
    ],
    category: "shirts",
    tag: "BESTSELLER",
    createdAt: "2026-09-13T10:20:00.000Z",
  },
  {
    _id: "6aa82525696b14ecf90065e8",
    title: "Tactical Cargo Parachute Pants",
    description: "Water-repellent ripstop fabric with adjustable bungee cords and utility pockets.",
    price: {
      amount: 2199,
      currency: "INR",
    },
    seller: "6aa2e4dbe763976ef634087b",
    images: [
      {
        url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=900",
        _id: "img_3",
      },
    ],
    category: "cargos",
    tag: "TRENDING",
    createdAt: "2026-09-12T08:15:00.000Z",
  },
  {
    _id: "6aa82525696b14ecf90065e9",
    title: "Vintage Washed Denim Trucker Jacket",
    description: "Structured 14oz rigid denim jacket featuring subtle distressing and custom matte silver hardware.",
    price: {
      amount: 2899,
      currency: "INR",
    },
    seller: "6aa2e4dbe763976ef634087b",
    images: [
      {
        url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=900",
        _id: "img_4",
      },
    ],
    category: "outerwear",
    tag: "LIMITED",
    createdAt: "2026-09-11T12:00:00.000Z",
  },
]

const CATEGORIES = [
  { id: "all", label: "ALL DROPS" },
  { id: "shirts", label: "SHIRTS" },
  { id: "tees", label: "T-SHIRTS" },
  { id: "outerwear", label: "JACKETS & OUTERWEAR" },
  { id: "cargos", label: "PANTS & CARGOS" },
]

const Home = () => {
  const navigate = useNavigate()
  const { handleGetAllProducts } = useProduct()
  const productsRaw = useSelector((state) => state.product?.products)
  const user = useSelector((state) => state.auth?.user)

  // Local states
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [activeImageIndexes, setActiveImageIndexes] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quickViewSize, setQuickViewSize] = useState("M")
  const [quickViewQty, setQuickViewQty] = useState(1)

  // Wishlist & Cart state
  const [wishlist, setWishlist] = useState([])
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        await handleGetAllProducts()
      } catch (err) {
        console.error("Error loading products:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Show temporary toast message
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  // Normalize products: merge Redux store products or use demo items if empty
  const allProducts = useMemo(() => {
    let list = []
    if (Array.isArray(productsRaw)) {
      list = productsRaw
    } else if (productsRaw && Array.isArray(productsRaw.products)) {
      list = productsRaw.products
    }

    // If backend provided products, use them
    if (list.length > 0) {
      return list
    }

    // Otherwise, fallback to demo items to provide an instant rich preview
    return DEMO_PRODUCTS
  }, [productsRaw])

  // Price formatting helper
  const formatPrice = (priceObj) => {
    if (!priceObj) return "₹0"
    const amount = typeof priceObj === "object" ? priceObj.amount ?? 0 : priceObj
    const currency = typeof priceObj === "object" ? priceObj.currency || "INR" : "INR"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "INR" ? "INR" : currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Filter & sort
  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => {
        const text = `${p.title || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase()
        return text.includes(selectedCategory.toLowerCase())
      })
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p._id?.toLowerCase().includes(q)
      )
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => {
        const pA = typeof a.price === "object" ? a.price.amount ?? 0 : a.price ?? 0
        const pB = typeof b.price === "object" ? b.price.amount ?? 0 : b.price ?? 0
        return pA - pB
      })
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const pA = typeof a.price === "object" ? a.price.amount ?? 0 : a.price ?? 0
        const pB = typeof b.price === "object" ? b.price.amount ?? 0 : b.price ?? 0
        return pB - pA
      })
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    return result
  }, [allProducts, selectedCategory, searchQuery, sortBy])

  // Image navigation
  const handleImageNav = (productId, totalImages, direction, e) => {
    if (e) e.stopPropagation()
    setActiveImageIndexes((prev) => {
      const current = prev[productId] || 0
      const next =
        direction === "next"
          ? (current + 1) % totalImages
          : (current - 1 + totalImages) % totalImages
      return { ...prev, [productId]: next }
    })
  }

  // Wishlist toggle
  const toggleWishlist = (product, e) => {
    if (e) e.stopPropagation()
    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === product._id)
      if (exists) {
        triggerToast(`Removed "${product.title}" from wishlist`)
        return prev.filter((item) => item._id !== product._id)
      } else {
        triggerToast(`Added "${product.title}" to wishlist`)
        return [...prev, product]
      }
    })
  }

  // Add to Bag
  const addToCart = (product, size = "M", quantity = 1, e) => {
    if (e) e.stopPropagation()
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item._id === product._id && item.size === size
      )
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += quantity
        return updated
      } else {
        return [...prev, { ...product, size, quantity }]
      }
    })
    triggerToast(`Added "${product.title}" (${size}) to Bag`)
  }

  // Update Cart Quantity
  const updateCartQty = (id, size, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item._id === id && item.size === size) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Cart total
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const amount = typeof item.price === "object" ? item.price.amount ?? 0 : item.price ?? 0
      return sum + amount * item.quantity
    }, 0)
  }, [cart])

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-black selection:text-white antialiased font-sans flex flex-col">
      {/* ==================== ANNOUNCEMENT BAR ==================== */}
      <div className="bg-black text-white py-2 px-4 text-center text-[11px] font-mono tracking-widest uppercase flex items-center justify-center gap-4">
        <span>⚡ FREE EXPRESS DELIVERY ON ORDERS OVER ₹999</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">CODE: SNITCHFIRST FOR ₹200 OFF</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">EASY 7-DAY DOORSTEP EXCHANGES</span>
      </div>

      {/* ==================== STICKY HEADER ==================== */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-bold tracking-[0.25em] text-black hover:opacity-80 transition-opacity"
            >
              SNITCH
            </Link>

            {/* Quick Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-medium tracking-wider uppercase text-neutral-600">
              <button
                onClick={() => {
                  setSelectedCategory("all")
                  document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })
                }}
                className={`hover:text-black transition-colors ${selectedCategory === "all" ? "text-black font-semibold underline underline-offset-8 decoration-2" : ""}`}
              >
                All Drops
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("shirts")
                  document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })
                }}
                className={`hover:text-black transition-colors ${selectedCategory === "shirts" ? "text-black font-semibold underline underline-offset-8 decoration-2" : ""}`}
              >
                Shirts
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("tees")
                  document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })
                }}
                className={`hover:text-black transition-colors ${selectedCategory === "tees" ? "text-black font-semibold underline underline-offset-8 decoration-2" : ""}`}
              >
                T-Shirts
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("outerwear")
                  document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })
                }}
                className={`hover:text-black transition-colors ${selectedCategory === "outerwear" ? "text-black font-semibold underline underline-offset-8 decoration-2" : ""}`}
              >
                Jackets
              </button>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search Input on Desktop */}
            <div className="relative hidden md:block w-56">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection..."
                className="w-full bg-neutral-100/70 border border-neutral-200 focus:border-black focus:bg-white text-neutral-900 text-xs pl-9 pr-7 py-2 outline-none transition-all placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>

            {/* Seller Dashboard Link (if seller) */}
            {user?.role === "seller" && (
              <Link
                to="/seller/dashboard"
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 px-3 py-1.5 transition-colors"
                title="Seller Dashboard"
              >
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                <span>Seller Hub</span>
              </Link>
            )}

            {/* Auth Link / Profile */}
            {user ? (
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-700">
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[11px]">
                  {user.fullname ? user.fullname[0].toUpperCase() : "U"}
                </span>
                <span className="hidden sm:inline font-sans font-medium text-neutral-900 truncate max-w-[100px]">
                  {user.fullname || user.email}
                </span>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-neutral-700 hover:text-black flex items-center gap-1 text-xs font-mono tracking-wider uppercase p-1.5"
                title="Account Login"
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => {
                if (wishlist.length === 0) {
                  triggerToast("Your wishlist is currently empty.")
                } else {
                  triggerToast(`${wishlist.length} item(s) in wishlist.`)
                }
              }}
              className="relative p-2 text-neutral-700 hover:text-black transition-colors"
              title="Wishlist"
            >
              <span className="material-symbols-outlined text-[22px]">favorite</span>
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-neutral-700 hover:text-black transition-colors"
              title="Shopping Bag"
            >
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3 border-t border-neutral-100">
          <div className="relative mt-2">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs pl-9 pr-7 py-2 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ==================== HERO BANNER ==================== */}
      <section className="relative w-full bg-neutral-900 text-white overflow-hidden border-b border-neutral-800">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28 lg:py-32 relative z-10 flex flex-col items-start justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-[10px] font-mono tracking-widest uppercase mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>AUTUMN / WINTER 2026 DROP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter uppercase leading-[1.05] max-w-3xl">
            Style. <span className="font-serif italic font-normal">Unfiltered.</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-xl font-light leading-relaxed">
            Contemporary silhouettes, heavyweight textiles, and relaxed luxury designed for the modern wardrobe.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="bg-white text-black hover:bg-neutral-200 text-xs font-medium uppercase tracking-[0.2em] px-8 py-4 transition-all"
            >
              Explore Collection
            </button>

            {user?.role === "seller" ? (
              <Link
                to="/seller/create-product"
                className="border border-white/40 hover:border-white text-white hover:bg-white/10 text-xs font-medium uppercase tracking-[0.2em] px-6 py-4 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>List New Product</span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="border border-white/30 hover:border-white text-white/80 hover:text-white text-xs font-medium uppercase tracking-[0.2em] px-6 py-4 transition-all"
              >
                Join Snitch Club
              </Link>
            )}
          </div>
        </div>

        {/* Feature Banner Bar */}
        <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-neutral-300 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white text-[20px]">verified</span>
              <span>100% Authentic Fits</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white text-[20px]">local_shipping</span>
              <span>Express Dispatch</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white text-[20px]">sync</span>
              <span>Hassle-Free Returns</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white text-[20px]">lock</span>
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CATALOG SECTION ==================== */}
      <main id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full">
        {/* Section Heading & Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase mb-1">
              Curated Wardrobe
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-neutral-900 tracking-tight">
              Latest Arrivals
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs uppercase tracking-wider px-3.5 py-2 whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-black text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-6">
          <div className="text-xs font-mono text-neutral-500">
            SHOWING <span className="text-black font-semibold">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "PRODUCT" : "PRODUCTS"}
            {selectedCategory !== "all" && (
              <span className="ml-2 uppercase bg-neutral-100 px-2 py-0.5 border border-neutral-200">
                {selectedCategory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-400 uppercase hidden sm:inline">
              Sort By:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs py-2 pl-3 pr-8 focus:border-black outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="title">Alphabetical</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[16px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* ==================== LOADING SKELETON ==================== */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-neutral-200 bg-neutral-50 animate-pulse">
                <div className="aspect-[3/4] bg-neutral-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-neutral-200" />
                  <div className="h-3 w-1/2 bg-neutral-200" />
                  <div className="h-4 w-1/3 bg-neutral-200 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== EMPTY STATE ==================== */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="border border-neutral-200 bg-neutral-50/60 p-16 text-center my-12">
            <span className="material-symbols-outlined text-4xl text-neutral-300 mb-3">
              inventory_2
            </span>
            <h3 className="text-lg font-light text-neutral-900 mb-2">No matching items found</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-light">
              We couldn't find any products matching your current filters or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              className="text-xs uppercase tracking-wider text-black border border-black hover:bg-black hover:text-white px-5 py-2.5 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ==================== PRODUCT GRID ==================== */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16">
            {filteredProducts.map((product) => {
              // Extract image URLs safely from images array (supporting { url: ... } or string)
              const images =
                Array.isArray(product.images) && product.images.length > 0
                  ? product.images.map((img) => (typeof img === "object" ? img.url : img))
                  : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900"]

              const activeIdx = activeImageIndexes[product._id] || 0
              const activeImgUrl = images[activeIdx] || images[0]
              const isWishlisted = wishlist.some((item) => item._id === product._id)

              return (
                <article
                  key={product._id}
                  className="group relative border border-neutral-200 hover:border-black bg-white flex flex-col justify-between transition-all duration-300"
                >
                  {/* Top Image Container */}
                  <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden"
                  onClick={()=>{navigate(`/product/${product._id}`)}}
                  >
                    <img
                      src={activeImgUrl}
                      alt={product.title || "Product"}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                      // onClick={() => {
                      //   setSelectedProduct(product)
                      //   setQuickViewSize("M")
                      //   setQuickViewQty(1)
                      // }}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900"
                      }}
                    />

                    {/* Tag / Badge */}
                    {product.tag && (
                      <span className="absolute top-3 left-3 bg-black text-white text-[9px] font-mono tracking-widest uppercase px-2 py-1 pointer-events-none">
                        {product.tag}
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => toggleWishlist(product, e)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                        isWishlisted
                          ? "bg-red-50 text-red-600"
                          : "bg-white/90 hover:bg-black hover:text-white text-neutral-700"
                      }`}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isWishlisted ? "favorite" : "favorite_border"}
                      </span>
                    </button>

                    {/* Multiple Images Navigation Dots / Arrows */}
                    {images.length > 1 && (
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleImageNav(product._id, images.length, "prev", e)}
                          className="w-6 h-6 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                        </button>
                        <div className="flex gap-1">
                          {images.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                dotIdx === activeIdx ? "bg-black" : "bg-neutral-400"
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={(e) => handleImageNav(product._id, images.length, "next", e)}
                          className="w-6 h-6 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        </button>
                      </div>
                    )}

                    {/* Quick View Overlay Button */}
                    <div className="absolute inset-x-3 bottom-3 hidden group-hover:flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setQuickViewSize("M")
                          setQuickViewQty(1)
                        }}
                        className="flex-1 bg-white/95 hover:bg-black hover:text-white text-black py-2 text-[11px] font-mono tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Quick View</span>
                      </button>
                      <button
                        onClick={(e) => addToCart(product, "M", 1, e)}
                        className="bg-black hover:bg-neutral-800 text-white p-2 transition-all shadow-md flex items-center justify-center"
                        title="Quick Add to Bag"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Information */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1.5">
                        <span className="truncate max-w-[120px]">
                          {product._id ? `#${product._id.slice(-6)}` : "SNITCH"}
                        </span>
                        <span>IN STOCK</span>
                      </div>

                      <h3
                        onClick={() => {
                          setSelectedProduct(product)
                          setQuickViewSize("M")
                          setQuickViewQty(1)
                        }}
                        className="text-sm font-medium text-neutral-900 line-clamp-1 hover:underline underline-offset-2 cursor-pointer transition-colors"
                        title={product.title}
                      >
                        {product.title || "Untitled Product"}
                      </h3>

                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1 font-light leading-relaxed">
                        {product.description || "Premium apparel engineered for effortless modern style."}
                      </p>
                    </div>

                    {/* Price & Size Indicators */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div className="text-base font-semibold text-neutral-950">
                        {formatPrice(product.price)}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                        <span>S</span>
                        <span>M</span>
                        <span>L</span>
                        <span>XL</span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* ==================== QUICK VIEW MODAL ==================== */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white border border-neutral-200 w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 hover:bg-black hover:text-white text-neutral-800 flex items-center justify-center transition-colors border border-neutral-200"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* Modal Image */}
            <div className="md:w-1/2 bg-neutral-100 relative aspect-[4/5] md:aspect-auto">
              <img
                src={
                  Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                    ? typeof selectedProduct.images[0] === "object"
                      ? selectedProduct.images[0].url
                      : selectedProduct.images[0]
                    : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900"
                }
                alt={selectedProduct.title}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Modal Details */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-2">
                  <span>SKU: {selectedProduct._id}</span>
                </div>

                <h3 className="text-2xl font-light text-neutral-900 mb-2">
                  {selectedProduct.title}
                </h3>

                <div className="text-xl font-semibold text-neutral-900 mb-4">
                  {formatPrice(selectedProduct.price)}
                </div>

                <div className="border-t border-neutral-200 pt-4 mb-4">
                  <p className="text-xs text-neutral-600 leading-relaxed font-light">
                    {selectedProduct.description || "No description provided."}
                  </p>
                </div>

                {/* Size Selector */}
                <div className="mb-5">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-neutral-500 uppercase">SELECT SIZE</span>
                    <span className="text-neutral-400 underline cursor-pointer">Size Guide</span>
                  </div>
                  <div className="flex gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setQuickViewSize(sz)}
                        className={`w-10 h-10 text-xs font-mono border transition-all ${
                          quickViewSize === sz
                            ? "border-black bg-black text-white"
                            : "border-neutral-300 hover:border-black text-neutral-800"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-6">
                  <span className="text-xs font-mono text-neutral-500 uppercase block mb-2">
                    QUANTITY
                  </span>
                  <div className="inline-flex items-center border border-neutral-300">
                    <button
                      onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 hover:bg-neutral-100 text-neutral-700"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-mono font-medium">
                      {quickViewQty}
                    </span>
                    <button
                      onClick={() => setQuickViewQty((q) => q + 1)}
                      className="px-3 py-1.5 hover:bg-neutral-100 text-neutral-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    addToCart(selectedProduct, quickViewSize, quickViewQty)
                    setSelectedProduct(null)
                    setIsCartOpen(true)
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white py-3.5 text-xs font-medium uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={(e) => toggleWishlist(selectedProduct, e)}
                  className="w-full border border-neutral-300 hover:border-black text-neutral-800 py-3 text-xs font-medium uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">favorite_border</span>
                  <span>Add to Wishlist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CART DRAWER ==================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-neutral-200 flex flex-col shadow-2xl">
              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-900">
                    Your Shopping Bag ({totalCartCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-neutral-400 hover:text-black p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Free Shipping Tracker */}
              <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 text-xs font-mono">
                {cartSubtotal >= 999 ? (
                  <div className="text-emerald-700 flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>You've unlocked FREE Express Shipping!</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-neutral-600">
                      Add ₹{(999 - cartSubtotal).toLocaleString("en-IN")} more for{" "}
                      <strong>FREE Shipping</strong>
                    </span>
                    <div className="w-full bg-neutral-200 h-1 mt-2">
                      <div
                        className="bg-black h-1 transition-all duration-300"
                        style={{ width: `${Math.min(100, (cartSubtotal / 999) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Items */}
              <div className="flex-1 overflow-y-auto p-6 divide-y divide-neutral-100">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-neutral-400">
                    <span className="material-symbols-outlined text-5xl mb-3 text-neutral-300">
                      production_quantity_limits
                    </span>
                    <p className="text-sm font-light text-neutral-600 mb-4">
                      Your shopping bag is empty.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs uppercase tracking-wider text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const imgUrl =
                      Array.isArray(item.images) && item.images.length > 0
                        ? typeof item.images[0] === "object"
                          ? item.images[0].url
                          : item.images[0]
                        : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900"

                    const itemAmount =
                      typeof item.price === "object" ? item.price.amount ?? 0 : item.price ?? 0

                    return (
                      <div key={`${item._id}-${item.size}-${idx}`} className="py-4 flex gap-4">
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-18 h-24 object-cover border border-neutral-200 bg-neutral-50 shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-medium text-neutral-900 line-clamp-1">
                                {item.title}
                              </h4>
                              <button
                                onClick={() => updateCartQty(item._id, item.size, -item.quantity)}
                                className="text-neutral-400 hover:text-red-600 text-xs"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 mt-1">
                              Size: {item.size} • ₹{itemAmount.toLocaleString("en-IN")}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="inline-flex items-center border border-neutral-300">
                              <button
                                onClick={() => updateCartQty(item._id, item.size, -1)}
                                className="px-2 py-0.5 text-xs hover:bg-neutral-100"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-0.5 text-xs font-mono font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQty(item._id, item.size, 1)}
                                className="px-2 py-0.5 text-xs hover:bg-neutral-100"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-semibold text-neutral-900 font-mono">
                              ₹{(itemAmount * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-neutral-200 bg-neutral-50/50 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500 uppercase">Subtotal</span>
                    <span className="text-base font-bold text-neutral-950">
                      ₹{cartSubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-light">
                    Taxes calculated at checkout. Free shipping applies above ₹999.
                  </p>
                  <button
                    onClick={() => {
                      triggerToast("Order placed successfully! (Demo Checkout)")
                      setCart([])
                      setIsCartOpen(false)
                    }}
                    className="w-full bg-black hover:bg-neutral-800 text-white py-3.5 text-xs font-medium uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST NOTIFICATION ==================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 text-xs font-mono tracking-wider shadow-2xl flex items-center gap-3 border border-neutral-800">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================== BRAND FOOTER ==================== */}
      <footer className="bg-neutral-950 text-neutral-400 border-t border-neutral-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <span className="text-xl font-bold tracking-[0.25em] text-white">SNITCH</span>
              <p className="text-xs font-light leading-relaxed text-neutral-500">
                Encapsulating modern streetwear, tailored fits, and contemporary design. Style.
                Unfiltered.
              </p>
              <div className="text-xs font-mono text-neutral-600">
                © {new Date().getFullYear()} SNITCH INC.
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-white mb-4">
                Shop Collections
              </h4>
              <ul className="space-y-2.5 text-xs font-light">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory("all")
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="hover:text-white transition-colors"
                  >
                    New Arrivals
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory("shirts")
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Casual Shirts
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory("tees")
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Oversized Tees
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory("outerwear")
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Jackets & Denim
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-white mb-4">
                Customer Care
              </h4>
              <ul className="space-y-2.5 text-xs font-light">
                <li>
                  <a href="#catalog-section" className="hover:text-white transition-colors">
                    Track Your Order
                  </a>
                </li>
                <li>
                  <a href="#catalog-section" className="hover:text-white transition-colors">
                    Return & Exchanges
                  </a>
                </li>
                <li>
                  <a href="#catalog-section" className="hover:text-white transition-colors">
                    Shipping Policy
                  </a>
                </li>
                <li>
                  <a href="#catalog-section" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-white mb-4">
                Join the Squad
              </h4>
              <p className="text-xs font-light text-neutral-500 mb-3">
                Subscribe for private drop access, early sales, and editorial drops.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  triggerToast("Thank you for joining the SNITCH squad!")
                }}
                className="flex"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  className="bg-neutral-900 border border-neutral-700 text-xs text-white px-3 py-2.5 outline-none focus:border-white flex-1"
                />
                <button
                  type="submit"
                  className="bg-white text-black px-4 text-xs font-mono uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
