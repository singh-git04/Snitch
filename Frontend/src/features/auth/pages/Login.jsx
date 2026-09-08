import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {useAuth} from "../hook/useAuth"
import ContinueWithGoogle from '../../../components/ContinueWithGoogle'

const Login = () => {
  const {handleLogin} = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    if (error) setError('')
  }

  const handleSubmit = async(e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    await handleLogin({
      email: formData.email,
      password: formData.password
    })
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e5e2e1] flex flex-col justify-between selection:bg-[#e5a910] selection:text-black relative overflow-hidden font-sans">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[radial-gradient(ellipse_at_center,_rgba(229,169,16,0.12)_0%,_rgba(217,119,6,0.04)_45%,_transparent_70%)] blur-2xl" />

      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-7 flex items-center justify-between border-b border-white/[0.06]">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="font-mono text-xl sm:text-2xl font-bold tracking-[0.28em] text-white group-hover:text-[#e5a910] transition-colors duration-200">
            SNITCH
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5a910]" />
        </Link>
        <div className="flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
          <span className="hidden sm:inline text-zinc-500">New to Snitch?</span>
          <Link
            to="/register"
            className="text-zinc-300 hover:text-[#e5a910] transition-colors border-b border-transparent hover:border-[#e5a910] pb-0.5"
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center px-6 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-block font-mono text-[11px] tracking-[0.25em] text-[#e5a910] uppercase mb-3 bg-[#e5a910]/10 px-3 py-1 rounded-full border border-[#e5a910]/20">
              Welcome Back
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              SIGN IN
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
              Access your saved archives, orders, and curated wishlist.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group relative pb-2 border-b border-white/[0.12] focus-within:border-[#e5a910] transition-colors duration-300">
              <label
                htmlFor="email"
                className="block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 mb-1 group-focus-within:text-[#e5a910] transition-colors duration-200"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full bg-transparent border-0 p-0 text-white placeholder-zinc-600 focus:outline-none focus:ring-0 text-base sm:text-[15px]"
                autoComplete="email"
              />
            </div>

            <div className="group relative pb-2 border-b border-white/[0.12] focus-within:border-[#e5a910] transition-colors duration-300">
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password"
                  className="block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 group-focus-within:text-[#e5a910] transition-colors duration-200"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-mono tracking-wider text-zinc-500 hover:text-[#e5a910] transition-colors"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-transparent border-0 p-0 text-white placeholder-zinc-600 focus:outline-none focus:ring-0 text-base sm:text-[15px]"
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#e5a910] hover:bg-[#ffc64d] text-black font-mono text-xs uppercase tracking-[0.2em] font-bold py-4 rounded transition-all duration-300 shadow-[0_4px_25px_rgba(229,169,16,0.22)] hover:shadow-[0_6px_30px_rgba(229,169,16,0.35)] active:scale-[0.99]"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <ContinueWithGoogle/>
          <div className="mt-8 text-center">
            <Link
              to="/register"
              className="font-mono text-xs tracking-wider text-zinc-400 hover:text-[#e5a910] transition-colors"
            >
              Don't have an account? Register
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-6 text-center border-t border-white/[0.04]">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-600">
          SNITCH APPAREL & ARCHIVE © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  )
}

export default Login
