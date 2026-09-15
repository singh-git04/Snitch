import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from "../hook/useAuth"
import ContinueWithGoogle from '../../../components/ContinueWithGoogle'

const Login = () => {
  const { handleLogin } = useAuth()
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
     const user =  await handleLogin({
        email: formData.email,
        password: formData.password
      })
     if(user.role == "buyer"){
        navigate('/')
      }else if(user.role == "seller"){
        navigate('/seller/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-black selection:text-white antialiased font-sans">
      {/* Top Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between border-b border-neutral-200">
        <Link to="/" className="text-xl font-bold tracking-[0.2em] text-black hover:opacity-75 transition-opacity">
          SNITCH
        </Link>
        <div className="flex items-center gap-4 text-xs font-mono tracking-wider uppercase">
          <span className="text-neutral-500">New customer?</span>
          <Link
            to="/register"
            className="text-black hover:underline underline-offset-4"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-light tracking-tight text-neutral-900 mb-2">
              Sign In
            </h1>
            <p className="text-sm text-neutral-500 font-light">
              Enter your email and password to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Email
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
            </div>

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
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white hover:bg-neutral-800 text-xs uppercase tracking-wider font-medium py-3.5 px-4 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <ContinueWithGoogle />

          <div className="mt-8 text-center">
            <Link
              to="/register"
              className="text-xs font-mono text-neutral-500 hover:text-black transition-colors"
            >
              Don't have an account? Register
            </Link>
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

export default Login
