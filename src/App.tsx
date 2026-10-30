import { useState, useEffect } from 'react'
import { SanityProvider, useSanity } from './context/SanityContext'
import { CartProvider } from './context/CartContext'
import type { PortableTextBlock } from './types'
import { useSeo } from './lib/seo'
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
import Subscription from './components/Subscription'

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F1] px-6 text-center">
      <h1 className="font-display text-3xl text-[#2D1F14] mb-3">Page introuvable</h1>
      <p className="text-[#6E4D32] mb-8">
        Cette page n’existe pas ou plus.
        <br />
        Nos pains, eux, sont toujours là.
      </p>
      <a
        href="/"
        className="rounded-full bg-[#A67C52] px-7 py-3.5 font-semibold tracking-wide text-white no-underline"
      >
        Retour à l’accueil
      </a>
    </main>
  )
}

function extractText(blocks: PortableTextBlock[] | null): string[] {
  if (!blocks) return []
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) =>
      (b.children || []).map((c) => c.text || '').join('')
    )
    .filter(Boolean)
}

function AppContent() {
  const path = usePath()
  const { products, settings, schedule, loading } = useSanity()
  useSeo(settings, schedule)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  if (path === '/mentions-legales') return <MentionsLegales />
  if (path === '/confidentialite') return <Confidentialite />
  if (path === '/cgv') return <CGV />
  if (path === '/abonnement') return <Subscription />
  // The server answers unknown paths with 404.html; this covers the installed
  // app, whose service worker serves the app shell for every navigation.
  if (path !== '/' && path !== '/index.html') return <NotFound />

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
