import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { Link, useNavigate } from "react-router"
import { useProduct } from "../hook/useProduct"

const Dashboard = () => {
  const navigate = useNavigate()
  const { handleGetSellerProduct } = useProduct()
  const sellerProductsRaw = useSelector((state) => state.product.sellerProducts)

  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState("grid") // "grid" | "table"
  const [activeImageIndexes, setActiveImageIndexes] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Normalize product list
  const products = useMemo(() => {
    if (Array.isArray(sellerProductsRaw)) return sellerProductsRaw
    if (sellerProductsRaw && Array.isArray(sellerProductsRaw.products)) return sellerProductsRaw.products
    return []
  }, [sellerProductsRaw])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      await handleGetSellerProduct()
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Image navigation
  const handleImageNav = (productId, totalImages, direction, e) => {
    e.stopPropagation()
    setActiveImageIndexes((prev) => {
      const current = prev[productId] || 0
      const next = direction === "next" ? (current + 1) % totalImages : (current - 1 + totalImages) % totalImages
      return { ...prev, [productId]: next }
    })
  }

  // Copy ID
  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Format price
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

  // Format date
  const formatDate = (isoString) => {
    if (!isoString) return "—"
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return "—"
    }
  }

  // Filter & sort
  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p._id?.toLowerCase().includes(q)
      )
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const pA = typeof a.price === "object" ? a.price.amount ?? 0 : a.price ?? 0
        const pB = typeof b.price === "object" ? b.price.amount ?? 0 : b.price ?? 0
        return pB - pA
      })
    } else if (sortBy === "price-low") {
      result.sort((a, b) => {
        const pA = typeof a.price === "object" ? a.price.amount ?? 0 : a.price ?? 0
        const pB = typeof b.price === "object" ? b.price.amount ?? 0 : b.price ?? 0
        return pA - pB
      })
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    return result
  }, [products, searchQuery, sortBy])

  // Overview metrics
  const metrics = useMemo(() => {
    const count = products.length
    const totalValuation = products.reduce((sum, p) => {
      const amount = typeof p.price === "object" ? p.price.amount ?? 0 : p.price ?? 0
      return sum + Number(amount || 0)
    }, 0)
    const avgPrice = count > 0 ? Math.round(totalValuation / count) : 0

    return { count, totalValuation, avgPrice }
  }, [products])

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-black selection:text-white antialiased font-sans">
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-[0.2em] text-black hover:opacity-75 transition-opacity">
              SNITCH
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 font-mono tracking-wider border-l border-neutral-200 pl-6">
              <span>SELLER PORTAL</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              title="Refresh listings"
              className="text-neutral-500 hover:text-black p-2 transition-colors disabled:opacity-40"
            >
              <span className={`material-symbols-outlined text-[20px] ${isLoading ? "animate-spin" : ""}`}>
                sync
              </span>
            </button>

            <Link
              to="/seller/create-product"
              className="bg-black text-white hover:bg-neutral-800 font-medium text-xs tracking-wider uppercase px-4 py-2.5 transition-colors"
            >
              + Add Product
            </Link>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {/* Title & Description */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-900">
              Inventory
            </h1>
            <p className="text-sm text-neutral-500 mt-2 font-light">
              View, filter, and manage your listed products.
            </p>
          </div>
        </div>

        {/* ==================== METRICS ==================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {/* Total Products */}
          <div className="border border-neutral-200 bg-neutral-50/60 p-6">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">Total Products</span>
            <div className="text-3xl font-light text-black mt-2">
              {isLoading ? "—" : metrics.count}
            </div>
          </div>

          {/* Catalog Valuation */}
          <div className="border border-neutral-200 bg-neutral-50/60 p-6">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">Total Valuation</span>
            <div className="text-3xl font-light text-black mt-2">
              {isLoading ? "—" : `₹${metrics.totalValuation.toLocaleString("en-IN")}`}
            </div>
          </div>

          {/* Average Price */}
          <div className="border border-neutral-200 bg-neutral-50/60 p-6">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">Average Price</span>
            <div className="text-3xl font-light text-black mt-2">
              {isLoading ? "—" : `₹${metrics.avgPrice.toLocaleString("en-IN")}`}
            </div>
          </div>
        </section>

        {/* ==================== SEARCH & FILTERS ==================== */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 border-b border-neutral-200 pb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, description or ID..."
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-xs pl-10 pr-8 py-2.5 outline-none placeholder:text-neutral-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs py-2.5 pl-3 pr-8 focus:border-black outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="title">Alphabetical</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[16px]">
                expand_more
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-neutral-200 bg-neutral-50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" ? "bg-black text-white" : "text-neutral-500 hover:text-black"
                }`}
                title="Grid"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 transition-colors ${
                  viewMode === "table" ? "bg-black text-white" : "text-neutral-500 hover:text-black"
                }`}
                title="Table"
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
            </div>
          </div>
        </section>

        {/* ==================== LOADING SKELETON ==================== */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-neutral-200 bg-neutral-50 animate-pulse">
                <div className="aspect-[4/5] bg-neutral-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-neutral-200" />
                  <div className="h-3 w-1/2 bg-neutral-200" />
                  <div className="h-5 w-1/4 bg-neutral-200 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== EMPTY STATE ==================== */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="border border-neutral-200 bg-neutral-50/50 p-16 text-center my-12">
            <h3 className="text-lg font-light text-neutral-900 mb-2">
              {searchQuery ? "No matching products" : "No products listed yet"}
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-light">
              {searchQuery
                ? `No products found for "${searchQuery}". Clear your search query to see all items.`
                : "Your store currently has no active product listings. Create your first product to get started."}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs uppercase tracking-wider text-black border border-neutral-300 hover:border-black px-4 py-2 transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <Link
                to="/seller/create-product"
                className="inline-block bg-black text-white hover:bg-neutral-800 text-xs uppercase tracking-wider font-medium px-6 py-3 transition-colors"
              >
                + Add Your First Product
              </Link>
            )}
          </div>
        )}

        {/* ==================== GRID VIEW ==================== */}
        {!isLoading && filteredProducts.length > 0 && viewMode === "grid" && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredProducts.map((product) => {
              const images = Array.isArray(product.images) && product.images.length > 0
                ? product.images.map((img) => (typeof img === "object" ? img.url : img))
                : ["https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800"]

              const activeIdx = activeImageIndexes[product._id] || 0
              const activeImgUrl = images[activeIdx] || images[0]

              return (
                <article
                  key={product._id}
                  className="border border-neutral-200 hover:border-black bg-white transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image */}
                    <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
                      <img
                        src={activeImgUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-500 cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      />

                      {/* Image Navigation */}
                      {images.length > 1 && (
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                          <button
                            onClick={(e) => handleImageNav(product._id, images.length, "prev", e)}
                            className="w-7 h-7 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors shadow-sm"
                            title="Previous image"
                          >
                            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                          </button>
                          <span className="text-[10px] font-mono bg-white/90 px-2 py-0.5 text-neutral-800 shadow-sm">
                            {activeIdx + 1} / {images.length}
                          </span>
                          <button
                            onClick={(e) => handleImageNav(product._id, images.length, "next", e)}
                            className="w-7 h-7 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors shadow-sm"
                            title="Next image"
                          >
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-2">
                        <button
                          onClick={(e) => handleCopyId(product._id, e)}
                          title="Copy ID"
                          className="hover:text-black transition-colors truncate max-w-[140px]"
                        >
                          #{product._id.slice(-8)}
                          {copiedId === product._id ? " (copied)" : ""}
                        </button>
                        <span>{formatDate(product.createdAt)}</span>
                      </div>

                      <h2
                        onClick={() => setSelectedProduct(product)}
                        className="text-base font-medium text-neutral-900 group-hover:text-black transition-colors truncate cursor-pointer"
                      >
                        {product.title || "Untitled Product"}
                      </h2>

                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5 font-light leading-relaxed">
                        {product.description || "No description provided."}
                      </p>

                      <div className="mt-4 pt-3 border-t border-neutral-150 flex items-center justify-between">
                        <span className="text-xs font-mono text-neutral-400">PRICE</span>
                        <span className="text-lg font-light text-black font-mono">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-neutral-150 bg-neutral-50/50 flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-neutral-600 hover:text-black transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Details</span>
                    </button>
                    <button
                      onClick={(e) => handleCopyId(product._id, e)}
                      className="text-neutral-400 hover:text-black transition-colors"
                      title="Copy Product ID"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedId === product._id ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* ==================== TABLE VIEW ==================== */}
        {!isLoading && filteredProducts.length > 0 && viewMode === "table" && (
          <div className="overflow-x-auto border border-neutral-200 bg-white mb-16">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-4 px-6 font-normal">Product</th>
                  <th className="py-4 px-6 font-normal">ID</th>
                  <th className="py-4 px-6 font-normal">Description</th>
                  <th className="py-4 px-6 font-normal text-right">Price</th>
                  <th className="py-4 px-6 font-normal">Date</th>
                  <th className="py-4 px-6 font-normal text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 font-light">
                {filteredProducts.map((product) => {
                  const imgUrl =
                    Array.isArray(product.images) && product.images.length > 0
                      ? typeof product.images[0] === "object"
                        ? product.images[0].url
                        : product.images[0]
                      : null

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div className="w-12 h-14 bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                          {imgUrl ? (
                            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <span className="material-symbols-outlined text-[16px]">image</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-neutral-900 truncate max-w-xs">{product.title}</span>
                      </td>

                      <td className="py-4 px-6 font-mono text-neutral-500">#{product._id.slice(-8)}</td>

                      <td className="py-4 px-6 text-neutral-600 max-w-xs">
                        <p className="truncate">{product.description || "—"}</p>
                      </td>

                      <td className="py-4 px-6 text-right font-mono text-neutral-900 font-medium">
                        {formatPrice(product.price)}
                      </td>

                      <td className="py-4 px-6 text-neutral-400 font-mono text-[11px]">
                        {formatDate(product.createdAt)}
                      </td>

                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2 text-neutral-400">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="hover:text-black transition-colors"
                            title="View details"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={(e) => handleCopyId(product._id, e)}
                            className="hover:text-black transition-colors"
                            title="Copy ID"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {copiedId === product._id ? "check" : "content_copy"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ==================== PRODUCT DETAIL MODAL ==================== */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white border border-neutral-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
              Product Overview • #{selectedProduct._id}
            </div>

            <h2 className="text-2xl font-light text-neutral-900 mb-6">{selectedProduct.title}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-[4/5] bg-neutral-100 border border-neutral-200 overflow-hidden">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img
                    src={
                      typeof selectedProduct.images[0] === "object"
                        ? selectedProduct.images[0].url
                        : selectedProduct.images[0]
                    }
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-mono">
                    NO IMAGE
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-mono text-neutral-400 uppercase">PRICE</span>
                  <div className="text-2xl font-light text-neutral-900 mt-1">
                    {formatPrice(selectedProduct.price)}
                  </div>

                  <span className="text-xs font-mono text-neutral-400 uppercase block mt-4">DESCRIPTION</span>
                  <p className="text-sm text-neutral-600 font-light mt-1 leading-relaxed">
                    {selectedProduct.description || "No description provided."}
                  </p>

                  <div className="mt-6 pt-4 border-t border-neutral-150 space-y-2 text-xs font-mono text-neutral-500">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Created:</span>
                      <span>{formatDate(selectedProduct.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Seller:</span>
                      <span>#{selectedProduct.seller ? selectedProduct.seller.slice(-6) : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-neutral-150">
                  <button
                    onClick={(e) => handleCopyId(selectedProduct._id, e)}
                    className="flex-1 py-2.5 border border-neutral-300 hover:border-black text-xs font-mono uppercase tracking-wider text-black transition-colors"
                  >
                    {copiedId === selectedProduct._id ? "Copied" : "Copy ID"}
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-8 py-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-500 text-xs font-mono">
        <div>SNITCH © {new Date().getFullYear()}</div>
        <div className="flex items-center gap-6">
          <Link to="/seller/create-product" className="hover:text-black transition-colors">
            Add Product
          </Link>
          <Link to="/" className="hover:text-black transition-colors">
            Storefront
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
