import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({
    default: module.LandingPage,
  }))
)

const SharePage = lazy(() =>
  import('./pages/SharePage').then((module) => ({
    default: module.default,
  }))
)

const WritePage = lazy(() =>
  import('./pages/WritePage').then((module) => ({
    default: module.WritePage,
  }))
)

const LegalCompliancePage = lazy(() =>
  import('./pages/LegalCompliancePage').then((module) => ({
    default: module.LegalCompliancePage,
  }))
)

const HumanSupportPage = lazy(() =>
  import('./pages/HumanSupportPage').then((module) => ({
    default: module.HumanSupportPage,
  }))
)

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#F6F1E8]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5E7C63] border-t-transparent" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/share" element={<SharePage />} />
          <Route path="/write" element={<WritePage />} />
          <Route path="/legal" element={<LegalCompliancePage />} />
          <Route path="/support" element={<HumanSupportPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
