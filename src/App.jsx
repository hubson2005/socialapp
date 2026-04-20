import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import PublicProfile from "./pages/PublicProfile.jsx"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:username" element={<PublicProfile />} />
    </Routes>
  )
}