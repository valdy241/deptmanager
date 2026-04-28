import { Routes, Route } from 'react-router'
import Home from './pages/Dashboard'
import Users from './pages/Users'
import Departments from './pages/Departments'
import Tasks from './pages/Tasks'
import Appointments from './pages/Appointments'
import Documents from './pages/Documents'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/users" element={<Users />} />
      <Route path="/departments" element={<Departments />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
