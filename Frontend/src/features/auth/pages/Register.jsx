import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hook/useAuth'
import ContinueWithGoogle from '../../../components/ContinueWithGoogle'

const Register = () => {
  const { handleRegister } = useAuth()
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

    try {
      await handleRegister({
        email: formData.email,
        contact: formData.contact,
        password: formData.password,
        fullname: formData.fullname,
        isSeller: formData.seller,
      })

      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setSubmitted(true)
        setTimeout(() => {
          navigate('/login')
        }, 1200)
      }, 800)
    } catch (err) {
      setErrors({ submit: err.message || 'Registration failed' })
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-black selection:text-white antialiased font-sans">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between border-b border-neutral-200">
        <Link to="/" className="text-xl font-bold tracking-[0.2em] text-black hover:opacity-75 transition-opacity">
          SNITCH
        </Link>
        <div className="flex items-center gap-4 text-xs font-mono tracking-wider uppercase">
          <span className="text-neutral-500">Already a member?</span>
          <Link
            to="/login"
            className="text-black hover:underline underline-offset-4"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-light tracking-tight text-neutral-900 mb-2">
              Create Account
            </h1>
            <p className="text-sm text-neutral-500 font-light">
              Join Snitch to explore curated collections and manage orders.
            </p>
          </div>

          {submitted && (
            <div className="mb-6 p-4 border border-neutral-300 bg-neutral-50 text-neutral-800 text-xs font-mono text-center">
              Account created. Redirecting to login...
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono text-center">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="fullname"
                className="block text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Full Name
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-sm px-4 py-3 outline-none placeholder:text-neutral-400 transition-colors"
                autoComplete="name"
              />
              {errors.fullname && (
                <p className="text-xs text-red-600 font-mono">{errors.fullname}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-wider text-neutral-500"
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
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-sm px-4 py-3 outline-none placeholder:text-neutral-400 transition-colors"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-red-600 font-mono">{errors.email}</p>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <label
                htmlFor="contact"
                className="block text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Contact Number
              </label>
              <input
                id="contact"
                name="contact"
                type="tel"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-sm px-4 py-3 outline-none placeholder:text-neutral-400 transition-colors"
                autoComplete="tel"
              />
              {errors.contact && (
                <p className="text-xs text-red-600 font-mono">{errors.contact}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-wider text-neutral-500"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-mono text-neutral-400 hover:text-black transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-black text-neutral-900 text-sm px-4 py-3 outline-none placeholder:text-neutral-400 transition-colors"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-red-600 font-mono">{errors.password}</p>
              )}
            </div>

            {/* Seller Checkbox */}
            <div className="pt-2">
              <label
                htmlFor="seller"
                className={`flex items-start gap-3.5 p-4 border transition-colors cursor-pointer ${
                  formData.seller
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white'
                }`}
              >
                <input
                  id="seller"
                  name="seller"
                  type="checkbox"
                  checked={formData.seller}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 border-neutral-300 text-black accent-black cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-900">
                    Register as a Seller
                  </span>
                  <span className="text-xs text-neutral-500 mt-0.5 font-light leading-relaxed">
                    Gain access to the seller portal to list and sell your products.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || submitted}
                className="w-full bg-black text-white hover:bg-neutral-800 text-xs uppercase tracking-wider font-medium py-3.5 px-4 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <ContinueWithGoogle />

          <div className="mt-8 text-center text-xs font-mono text-neutral-400">
            By creating an account you agree to our Terms and Privacy Policy.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-neutral-200">
        <span className="text-xs font-mono text-neutral-400">
          SNITCH © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  )
}

export default Register
