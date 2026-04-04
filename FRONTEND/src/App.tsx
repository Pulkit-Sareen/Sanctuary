import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import SharePage from './pages/SharePage'
import { SupportHubPage } from './pages/SupportHubPage'
import { SupportHubResourcesPage } from './pages/SupportHubResourcesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/support-hub" element={<SupportHubPage />} />
        <Route path="/support-hub/resources" element={<SupportHubResourcesPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
