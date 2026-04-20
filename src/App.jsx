import { Routes, Route } from "react-router-dom"
import Home from "./pages/home"
import PublicProfile from "./pages/publicprofile"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:username" element={<PublicProfile />} />
    </Routes>
  )
}