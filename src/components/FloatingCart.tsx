import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useSanity } from '../context/SanityContext'

export default function FloatingCart() {
  const { totalItems, totalPrice, cart } = useCart()
  const { products } = useSanity()

  const hasItems = totalItems > 0
  const price = totalPrice(products)

  const handleClick = () => {
    const el = document.getElementById('order')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 transition-all duration-300"
      style={{
        transform: hasItems ? 'scale(1)' : 'scale(0.8)',
        opacity: hasItems ? 1 : 0,
        pointerEvents: hasItems ? 'auto' : 'none',
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        style={{
          background: '#A67C52',
          boxShadow: '0 8px 32px rgba(45,31,20,0.25), 0 2px 8px rgba(45,31,20,0.15)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#8B6340'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(45,31,20,0.3), 0 4px 12px rgba(45,31,20,0.2)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#A67C52'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(45,31,20,0.25), 0 2px 8px rgba(45,31,20,0.15)'
        }}
        aria-label={`Panier — ${totalItems} article${totalItems > 1 ? 's' : ''}`}
      >
        <div className="relative">
          <ShoppingBag size={20} />
          {Object.keys(cart).length > 0 && (
            <span
              className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center rounded-full text-white font-bold"
              style={{
                fontSize: '0.6rem',
                background: '#2D1F14',
                lineHeight: 1,
              }}
            >
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </div>
        <span className="font-semibold text-sm" style={{ letterSpacing: '0.02em' }}>
          € {price.toFixed(2).replace('.', ',')}
        </span>
      </button>
    </div>
  )
}
