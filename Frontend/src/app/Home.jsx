import React from 'react'
import { Link } from 'react-router'

const Home = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-8 antialiased font-sans selection:bg-black selection:text-white">
      {/* Navigation */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
        <Link to="/" className="text-xl font-bold tracking-[0.2em] text-black">
          SNITCH
        </Link>
        <nav className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
          <Link to="/seller/dashboard" className="text-neutral-500 hover:text-black transition-colors">
            Dashboard
          </Link>
          <Link to="/seller/create-product" className="text-neutral-500 hover:text-black transition-colors">
            List Product
          </Link>
          <Link to="/login" className="text-neutral-500 hover:text-black transition-colors">
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="max-w-3xl mx-auto text-center py-24">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-4">
          Style. Unfiltered.
        </span>
        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-neutral-900 mb-6">
          Curated Apparel & Minimalist Architecture
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 font-light max-w-lg mx-auto mb-10 leading-relaxed">
          A modern marketplace engineered for effortless navigation, transparent seller operations, and timeless silhouettes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/seller/dashboard"
            className="w-full sm:w-auto bg-black text-white hover:bg-neutral-800 text-xs font-medium uppercase tracking-wider px-8 py-3.5 transition-colors"
          >
            Go to Seller Dashboard
          </Link>
          <Link
            to="/seller/create-product"
            className="w-full sm:w-auto border border-neutral-300 hover:border-black text-black text-xs uppercase tracking-wider px-8 py-3.5 transition-colors"
          >
            Create Product Listing
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-6 border-t border-neutral-200 text-center text-xs font-mono text-neutral-400">
        SNITCH © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default Home
