import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const fetchProjects = () => {
    axios.get('/api/projects', { withCredentials: true })
      .then(res => setProjects(res.data))
      .catch(err => setError(err.response?.data?.error || 'Request failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!name.trim()) return setFormError('Project name is required')
    setSubmitting(true)

    try {
      await axios.post('/api/projects', { name, description }, { withCredentials: true })
      setName('')
      setDescription('')
      setShowForm(false)
      fetchProjects()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await axios.delete(`/api/projects/${id}`, { withCredentials: true })
      setProjects(projects.filter(p => p.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed')
    }
  }

  return (
    <div className="page">
      <Header />
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Projects</h1>
          {user?.role === 'admin' && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ New Project'}
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {showForm && (
          <div className="card">
            <h2 className="card-title">Create Project</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter project name"
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description"
                  rows={3}
                  disabled={submitting}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="card">
            <p className="empty-text">No projects found.</p>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th>Members</th>
                  <th>Tasks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td className="td-bold">{project.name}</td>
                    <td>{project.description || '-'}</td>
                    <td>{project.creator_name || '-'}</td>
                    <td>{project.member_count || 0}</td>
                    <td>{project.task_count || 0}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          View
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleDelete(project.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}