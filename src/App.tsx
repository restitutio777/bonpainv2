import { useState, useEffect } from 'react'
import { SanityProvider, useSanity } from './context/SanityContext'
import { CartProvider } from './context/CartContext'
import FloatingCart from './components/FloatingCart'
import VacationBanner from './components/VacationBanner'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Products from './components/Products'
import Schedule from './components/Schedule'
import Info from './components/Info'
import OrderForm from './components/OrderForm'
import Footer from './components/Footer'
import Modal from './components/Modal'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import MentionsLegales from './components/legal/MentionsLegales'
import Confidentialite from './components/legal/Confidentialite'
import CGV from './components/legal/CGV'

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function extractText(blocks: any[] | null): string[] {
  if (!blocks) return []
  return blocks
    .filter((b: any) => b._type === 'block')
    .map((b: any) =>
      (b.children || []).map((c: any) => c.text || '').join('')
    )
    .filter(Boolean)
}

function AppContent() {
  const path = usePath()
  const { products, loading } = useSanity()
  const [activeModal, setActiveModal] = useState<string | null>(null)

  if (path === '/mentions-legales') return <MentionsLegales />
  if (path === '/confidentialite') return <Confidentialite />
  if (path === '/cgv') return <CGV />

  const modalProduct = products.find((p) => p._id === activeModal)

  const modalContent = modalProduct
    ? {
        fr: {
          title: modalProduct.modalTitleFr || modalProduct.name,
          subtitle: modalProduct.modalSubtitleFr || '',
          body: extractText(modalProduct.modalBodyFr),
        },
        de: {
          title: modalProduct.modalTitleDe || modalProduct.name,
          subtitle: modalProduct.modalSubtitleDe || '',
          body: extractText(modalProduct.modalBodyDe),
        },
      }
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <div className="animate-pulse text-[#A67C52] font-serif text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <VacationBanner />
        <Nav />
      </div>
      <Hero />
      <Products onOpenModal={(id: string) => setActiveModal(id)} />
      <Schedule />
      <Info />
      <OrderForm />
      <About />
      <Footer />
      <FloatingCart />
      <PWAInstallPrompt />

      {modalContent && (
        <Modal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          content={modalContent}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <SanityProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </SanityProvider>
  )
}
