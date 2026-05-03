import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Header() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true })
    } catch (err) {
      console.error(err)
    }
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="navbar">
      <span className="navbar-brand">Task Manager</span>
      <div className="navbar-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/projects" className="nav-link">Projects</Link>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  )
}