import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const payload = isSignup ? { name, email, password } : { email, password }
      const res = await axios.post(url, payload, { withCredentials: true })
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Task Manager</h1>
        <p className="login-sub">{isSignup ? 'Create your account' : 'Sign in to continue'}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="login-toggle">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            className="link-btn"
            onClick={() => { setIsSignup(!isSignup); setError('') }}
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}