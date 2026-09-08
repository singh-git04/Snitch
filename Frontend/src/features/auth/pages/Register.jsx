import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth  } from '../hook/useAuth'
import ContinueWithGoogle from '../../../components/ContinueWithGoogle'

const Register = () => {
  const {handleRegister} = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    contact: '',
    password: '',
    seller: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.fullname.trim()) newErrors.fullname = 'Full name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    await handleRegister({
        email: formData.email,
        contact: formData.contact,
        password: formData.password,
        fullname: formData.fullname,
        isSeller: formData.isSeller
    })

    setIsLoading(true)
    // Simulate auth registration request
    setTimeout(() => {
      setIsLoading(false)
      setSubmitted(true)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e5e2e1] flex flex-col justify-between selection:bg-[#e5a910] selection:text-black relative overflow-hidden font-sans">
      {/* Ambient background glow in dark yellow theme */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[radial-gradient(ellipse_at_center,_rgba(229,169,16,0.12)_0%,_rgba(217,119,6,0.04)_45%,_transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] bg-[radial-gradient(circle,_rgba(229,169,16,0.05)_0%,_transparent_70%)] blur-3xl" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-7 flex items-center justify-between border-b border-white/[0.06]">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="font-mono text-xl sm:text-2xl font-bold tracking-[0.28em] text-white group-hover:text-[#e5a910] transition-colors duration-200">
            SNITCH
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5a910] group-hover:scale-125 transition-transform duration-200" />
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
          <span className="hidden sm:inline text-zinc-500">Already a member?</span>
          <Link
            to="/login"
            className="text-zinc-300 hover:text-[#e5a910] transition-colors border-b border-transparent hover:border-[#e5a910] pb-0.5"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area - Airy, Minimalist & Breathing */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-6 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-block font-mono text-[11px] tracking-[0.25em] text-[#e5a910] uppercase mb-3 bg-[#e5a910]/10 px-3 py-1 rounded-full border border-[#e5a910]/20">
              New Collection & Archive Access
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              CREATE ACCOUNT
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
              Step into the world of elevated streetwear and timeless silhouettes.
            </p>
          </div>

          {/* Success Banner */}
          {submitted && (
            <div className="mb-8 p-4 rounded bg-[#e5a910]/10 border border-[#e5a910]/40 text-[#ffc64d] text-sm text-center font-mono tracking-wide animate-pulse">
              Account created successfully. Redirecting to login...
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Full Name */}
            <div className="group relative pb-2 border-b border-white/[0.12] focus-within:border-[#e5a910] transition-colors duration-300">
              <label
                htmlFor="fullname"
                className="block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 mb-1 group-focus-within:text-[#e5a910] transition-colors duration-200"
              >
                Full Name
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                className="w-full bg-transparent border-0 p-0 text-white placeholder-zinc-600 focus:outline-none focus:ring-0 text-base sm:text-[15px]"
                autoComplete="name"
              />
              {errors.fullname && (
                <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.fullname}</p>
              )}
            </div>

            {/* Email Address */}
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
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.email}</p>
              )}
            </div>

            {/* Contact */}
            <div className="group relative pb-2 border-b border-white/[0.12] focus-within:border-[#e5a910] transition-colors duration-300">
              <label
                htmlFor="contact"
                className="block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 mb-1 group-focus-within:text-[#e5a910] transition-colors duration-200"
              >
                Contact Number
              </label>
              <input
                id="contact"
                name="contact"
                type="tel"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+91 XXX-XXX-XX"
                className="w-full bg-transparent border-0 p-0 text-white placeholder-zinc-600 focus:outline-none focus:ring-0 text-base sm:text-[15px]"
                autoComplete="tel"
              />
              {errors.contact && (
                <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.contact}</p>
              )}
            </div>

            {/* Password */}
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
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.password}</p>
              )}
            </div>

            {/* Seller Checkbox Field */}
            <div className="pt-3 pb-2">
              <label
                htmlFor="seller"
                className={`relative flex items-start gap-3.5 p-3.5 rounded border transition-all duration-300 cursor-pointer ${
                  formData.seller
                    ? 'border-[#e5a910]/50 bg-[#e5a910]/[0.06] shadow-[0_0_20px_rgba(229,169,16,0.08)]'
                    : 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="seller"
                    name="seller"
                    type="checkbox"
                    checked={formData.seller}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#e5a910] focus:ring-[#e5a910] focus:ring-offset-0 focus:ring-1 cursor-pointer accent-[#e5a910]"
                  />
                </div>
                <div className="flex flex-col select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white tracking-wide">
                      Register as a Seller
                    </span>
                    {formData.seller && (
                      <span className="font-mono text-[10px] uppercase tracking-wider bg-[#e5a910] text-black px-1.5 py-0.5 rounded font-semibold">
                        Seller Mode
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Join Snitch's curated marketplace to list and retail your fashion collections.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || submitted}
                className="w-full relative group overflow-hidden bg-[#e5a910] hover:bg-[#ffc64d] text-black font-mono text-xs uppercase tracking-[0.2em] font-bold py-4 rounded transition-all duration-300 shadow-[0_4px_25px_rgba(229,169,16,0.22)] hover:shadow-[0_6px_30px_rgba(229,169,16,0.35)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>

         

          {/* Google Sign in */}
          <ContinueWithGoogle/>

          {/* Footer note & link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500 leading-relaxed">
              By creating an account, you agree to Snitch's{' '}
              <a href="#" className="underline hover:text-zinc-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-zinc-300 transition-colors">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Brand Footer */}
      <footer className="relative z-10 w-full py-6 text-center border-t border-white/[0.04]">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-600">
          SNITCH APPAREL & ARCHIVE © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  )
}

export default Register
