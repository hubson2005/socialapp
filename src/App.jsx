import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import PublicProfile from './pages/PublicProfile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App