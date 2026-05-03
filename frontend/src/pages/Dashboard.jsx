import { useState, useEffect } from 'react'
import axios from 'axios'
import Header from '../components/Header'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    axios.get('/api/tasks/dashboard', { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.error || 'Request failed'))
      .finally(() => setLoading(false))
  }, [])

  const statusBadge = (status) => {
    const map = { 'Done': 'badge-green', 'In Progress': 'badge-blue', 'Todo': 'badge-gray' }
    return `badge ${map[status] || 'badge-gray'}`
  }

  return (
    <div className="page">
      <Header />
      <div className="container">
        <h1 className="page-title">Welcome, {user?.name}</h1>

        {loading && <p className="loading-text">Loading...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Total Tasks</p>
                <p className="stat-number">{stats.total}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">To-do</p>
                <p className="stat-number">{stats.todo}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">In Progress</p>
                <p className="stat-number">{stats.inProgress}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Done</p>
                <p className="stat-number stat-green">{stats.done}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Overdue</p>
                <p className="stat-number stat-red">{stats.overdue.length}</p>
              </div>
            </div>

            {stats.overdue.length > 0 && (
              <div className="card">
                <h2 className="card-title">Overdue Tasks</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.overdue.map(task => (
                      <tr key={task.id}>
                        <td className="td-bold">{task.title}</td>
                        <td>{task.project_name}</td>
                        <td className="td-red">{new Date(task.due_date).toLocaleDateString()}</td>
                        <td><span className={statusBadge(task.status)}>{task.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {stats.recentTasks.length > 0 && (
              <div className="card">
                <h2 className="card-title">My Tasks</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTasks.map(task => (
                      <tr key={task.id}>
                        <td className="td-bold">{task.title}</td>
                        <td>{task.project_name}</td>
                        <td><span className={statusBadge(task.status)}>{task.status}</span></td>
                        <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {stats.total === 0 && (
              <div className="card">
                <p className="empty-text">No tasks assigned to you yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}