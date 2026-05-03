import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskError, setTaskError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const fetchProject = () => {
    axios.get(`/api/projects/${id}`, { withCredentials: true })
      .then(res => setProject(res.data))
      .catch(err => setError(err.response?.data?.error || 'Request failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProject()
    if (user?.role === 'admin') {
      axios.get('/api/users', { withCredentials: true })
        .then(res => setAllUsers(res.data))
        .catch(() => {})
    }
  }, [id])

  const handleAddTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    if (!taskTitle.trim()) return setTaskError('Task title is required')
    setSubmitting(true)

    try {
      await axios.post('/api/tasks', {
        project_id: id,
        title: taskTitle,
        description: taskDesc,
        assigned_to: taskAssignee || null,
        due_date: taskDueDate || null
      }, { withCredentials: true })

      setTaskTitle('')
      setTaskDesc('')
      setTaskAssignee('')
      setTaskDueDate('')
      setShowTaskForm(false)
      fetchProject()
    } catch (err) {
      setTaskError(err.response?.data?.error || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}/status`, { status: newStatus }, { withCredentials: true })
      fetchProject()
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await axios.delete(`/api/tasks/${taskId}`, { withCredentials: true })
      fetchProject()
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed')
    }
  }

  const handleAddMember = async (userId) => {
    try {
      await axios.post(`/api/projects/${id}/members`, { user_id: userId }, { withCredentials: true })
      fetchProject()
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed')
    }
  }

  const handleRemoveMember = async (userId) => {
    try {
      await axios.delete(`/api/projects/${id}/members/${userId}`, { withCredentials: true })
      fetchProject()
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed')
    }
  }

  const statusBadge = (status) => {
    const map = { 'Done': 'badge-green', 'In Progress': 'badge-blue', 'Todo': 'badge-gray' }
    return `badge ${map[status] || 'badge-gray'}`
  }

  const isOverdue = (task) =>
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done'

  const memberIds = project?.members?.map(m => m.id) || []
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id))

  return (
    <div className="page">
      <Header />
      <div className="container">
        {loading && <p className="loading-text">Loading...</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {project && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">{project.name}</h1>
                {project.description && <p className="page-sub">{project.description}</p>}
              </div>
              {user?.role === 'admin' && (
                <button className="btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
                  {showTaskForm ? 'Cancel' : '+ Add Task'}
                </button>
              )}
            </div>

            {showTaskForm && (
              <div className="card">
                <h2 className="card-title">Create Task</h2>
                {taskError && <div className="alert alert-error">{taskError}</div>}
                <form onSubmit={handleAddTask}>
                  <div className="form-group">
                    <label>Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      rows={2}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Assign To</label>
                      <select
                        value={taskAssignee}
                        onChange={e => setTaskAssignee(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">Unassigned</option>
                        {project.members.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Task'}
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <h2 className="card-title">Tasks ({project.tasks.length})</h2>
              {project.tasks.length === 0 ? (
                <p className="empty-text">No tasks yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      {user?.role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {project.tasks.map(task => (
                      <tr key={task.id} className={isOverdue(task) ? 'row-overdue' : ''}>
                        <td className="td-bold">
                          {task.title}
                          {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
                        </td>
                        <td>{task.assignee_name || 'Unassigned'}</td>
                        <td>
                          <select
                            className="status-select"
                            value={task.status}
                            onChange={e => handleStatusChange(task.id, e.target.value)}
                          >
                            <option value="Todo">To-do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                          </select>
                        </td>
                        <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                        <td>
                          {user?.role === 'admin' && (
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">Members ({project.members.length})</h2>
              {project.members.length === 0 ? (
                <p className="empty-text">No members added yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      {user?.role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {project.members.map(member => (
                      <tr key={member.id}>
                        <td className="td-bold">{member.name}</td>
                        <td>{member.email}</td>
                        <td><span className="badge badge-gray">{member.role}</span></td>
                        {user?.role === 'admin' && (
                          <td>
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {user?.role === 'admin' && nonMembers.length > 0 && (
                <div className="add-member-row">
                  <p className="add-member-label">Add member:</p>
                  <div className="member-chips">
                    {nonMembers.map(u => (
                      <button
                        key={u.id}
                        className="btn-secondary btn-sm"
                        onClick={() => handleAddMember(u.id)}
                      >
                        + {u.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}