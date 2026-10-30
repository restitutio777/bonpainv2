import { Plus, Calendar } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useSanity } from '../context/SanityContext'
import { useCart } from '../context/CartContext'
import { getProductStatus, isByWeight, portionOf, unitPrice } from '../lib/productStatus'
import { urlFor } from '../lib/sanity'
import fallbackImg from '../assets/mood/baguettes-800.webp'
import type { SanityImageSource } from '@sanity/image-url'

// Local file, not a hotlinked stock photo: a product without a picture should
// still show the bakery's own bread, and not depend on a third-party host.
const FALLBACK_IMG = fallbackImg

// Cards are 4:3 and at most 355 px wide (three columns in a 1200 px
// container), full width on phones. Sanity delivers AVIF/WebP in the width the
// browser picks; nothing wider than 1000 px is ever needed.
const CARD_WIDTHS = [400, 600, 800, 1000]
const CARD_SIZES = '(min-width: 1280px) 355px, (min-width: 1024px) 29vw, (min-width: 768px) 46vw, 92vw'

// Slight zoom on every card photo: the shots have paper edges and tray rims at
// the border that read as clutter in the small 4:3 frame.
const IMG_ZOOM = 1.08
const IMG_ZOOM_HOVER = 1.13

function cardUrl(image: SanityImageSource, width: number) {
  return urlFor(image)
    .width(width)
    .height(Math.round(width * 0.75))
    .fit('crop')
    .auto('format')
    .quality(75)
    .url()
}

interface ProductsProps {
  onOpenModal: (id: string) => void
}

export default function Products({ onOpenModal }: ProductsProps) {
  useScrollAnimation()
  const { products, content } = useSanity()
  const { cart, addToCart } = useCart()

  const label = content?.productsLabel || 'Nos pains'
  const title = content?.productsTitle || 'Du pain'
  const titleAccent = content?.productsTitleAccent || 'fait pour vous'
  const subtitle =
    content?.productsSubtitle ||
    'Pains sur commande et assortiment du jour, préparés avec soin en petite production. Choisissez vos pains, nous les préparons pour le jour de votre retrait.'
  const saturdayNotice =
    content?.saturdayNotice ||
    'Chaque jour de vente, nous ajoutons un petit choix de viennoiseries faites maison — croissants et pains au chocolat sur commande.'

  return (
    <section
      id="products"
      className="py-28 lg:py-36 relative"
      style={{ background: '#FDF8F3' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #E8D9C8, transparent)' }}
      />
      <div className="container mx-auto px-5 md:px-10 max-w-[1200px]">
        <div className="text-center max-w-[600px] mx-auto mb-16 animate-on-scroll">
          <div
            className="text-xs font-semibold uppercase tracking-[0.15em] mb-4"
            style={{ color: '#A67C52' }}
          >
            {label}
          </div>
          <h2
            className="font-display font-normal leading-[1.15] mb-4"
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
              color: '#2D1F14',
              textWrap: 'balance',
            }}
          >
            {title}{' '}
            <em className="not-italic italic" style={{ color: '#A67C52' }}>
              {titleAccent}
            </em>
          </h2>
          <p
            className="text-lg leading-[1.7]"
            style={{ color: '#8B7A6B', textWrap: 'pretty' }}
          >
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {products.map((product, i) => {
            const status = getProductStatus(product)
            const unavailable = !status.available
            return (
            <div
              key={product._id}
              className={`animate-on-scroll bg-white rounded-xl overflow-hidden group transition-all duration-400 flex flex-col ${product.hasModal ? 'cursor-pointer' : ''}`}
              style={{
                transitionDelay: `${(i % 3) * 0.1}s`,
                boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
              }}
              onClick={() => {
                if (product.hasModal) onOpenModal(product._id)
              }}
              onMouseEnter={(e) => {
                if (!product.hasModal) return
                const card = e.currentTarget as HTMLElement
                card.style.transform = 'translateY(-6px)'
                card.style.boxShadow = '0 8px 32px rgba(45,31,20,0.1)'
                const img = card.querySelector('img')
                if (img) img.style.transform = `scale(${IMG_ZOOM_HOVER})`
              }}
              onMouseLeave={(e) => {
                if (!product.hasModal) return
                const card = e.currentTarget as HTMLElement
                card.style.transform = 'translateY(0)'
                card.style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)'
                const img = card.querySelector('img')
                if (img) img.style.transform = `scale(${IMG_ZOOM})`
              }}
            >
              <div className="overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                <img
                  src={product.image ? cardUrl(product.image, 800) : FALLBACK_IMG}
                  srcSet={
                    product.image
                      ? CARD_WIDTHS.map((w) => `${cardUrl(product.image!, w)} ${w}w`).join(', ')
                      : undefined
                  }
                  sizes={CARD_SIZES}
                  alt={product.imageAlt || product.name}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700"
                  style={{ transform: `scale(${IMG_ZOOM})` }}
                />
                {status.badge && (
                  <div
                    className={`absolute px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                      status.kind === 'unavailable'
                        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                        : 'top-3 right-3'
                    }`}
                    style={{
                      background:
                        status.kind === 'unavailable'
                          ? 'rgba(178,34,34,0.92)'
                          : 'rgba(45,31,20,0.75)',
                      backdropFilter: 'blur(8px)',
                      color: '#F5EDE3',
                    }}
                  >
                    {status.badge}
                  </div>
                )}
              </div>

              {/* Column so the price row sits at the bottom of every card in a
                  row, however long each description is. */}
              <div className="p-6 flex-1 flex flex-col">
                <h3
                  className="font-display text-2xl font-medium mb-1.5"
                  style={{ color: '#2D1F14' }}
                >
                  {product.name}
                </h3>
                <p className="text-base leading-[1.5] mb-3" style={{ color: '#8B7A6B' }}>
                  {product.description}
                </p>
                {product.allergens && (
                  <p
                    className="text-sm leading-snug pt-3 mb-1"
                    style={{ color: '#6B5D4F', borderTop: '1px solid #EADFD0' }}
                  >
                    <span
                      className="block font-semibold uppercase mb-0.5"
                      style={{ color: '#A67C52', fontSize: '0.7rem', letterSpacing: '0.05em' }}
                    >
                      Allergènes
                    </span>
                    {product.allergens}
                  </p>
                )}
                <div
                  className="flex items-center justify-between mt-auto pt-4"
                  style={{ borderTop: '1px solid #F5EDE3' }}
                >
                  {/* The price is required by law but deliberately quiet:
                      the bread and its description lead, not the number. */}
                  <span className="text-sm" style={{ color: '#8B7A6B' }}>
                    {/* Counter-only items without a known price are stored as 0. */}
                    {product.price > 0
                      ? isByWeight(product)
                        ? `€ ${product.price.toFixed(2).replace('.', ',')} / kg · ${portionOf(product)} g : € ${unitPrice(product).toFixed(2).replace('.', ',')}`
                        : `€ ${product.price.toFixed(2).replace('.', ',')}`
                      : 'Prix en magasin'}
                  </span>
                  {product.orderInForm !== false && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!unavailable) addToCart(product._id)
                    }}
                    disabled={unavailable}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
                    style={{
                      background: unavailable ? '#F0E5D8' : (cart[product._id] ? '#A67C52' : '#FDF8F3'),
                      border: `1px solid ${unavailable ? '#E0D0BD' : (cart[product._id] ? '#A67C52' : '#E8D9C8')}`,
                      color: unavailable ? '#BFA07E' : (cart[product._id] ? 'white' : '#A67C52'),
                      cursor: unavailable ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (unavailable) return
                      e.stopPropagation()
                      ;(e.currentTarget as HTMLElement).style.background = '#8B6340'
                      ;(e.currentTarget as HTMLElement).style.color = 'white'
                      ;(e.currentTarget as HTMLElement).style.borderColor = '#8B6340'
                    }}
                    onMouseLeave={(e) => {
                      if (unavailable) return
                      e.stopPropagation()
                      ;(e.currentTarget as HTMLElement).style.background = cart[product._id] ? '#A67C52' : '#FDF8F3'
                      ;(e.currentTarget as HTMLElement).style.color = cart[product._id] ? 'white' : '#A67C52'
                      ;(e.currentTarget as HTMLElement).style.borderColor = cart[product._id] ? '#A67C52' : '#E8D9C8'
                    }}
                    aria-label={
                      unavailable
                        ? `${product.name} actuellement non disponible`
                        : `Ajouter ${product.name} au panier`
                    }
                    title={unavailable ? `${product.name} — ${status.badge}` : undefined}
                  >
                    {cart[product._id] && !unavailable ? (
                      <span className="text-xs font-bold">{cart[product._id]}</span>
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>

        <div
          className="flex items-center justify-center gap-2 mt-10 px-6 py-3.5 rounded-xl animate-on-scroll"
          style={{
            background: 'white',
            border: '1px dashed #D4BFA5',
          }}
        >
          <Calendar size={16} style={{ color: '#A67C52' }} />
          <span className="text-base" style={{ color: '#6E4D32' }}>
            {saturdayNotice}
          </span>
        </div>

        {/* General cross-contact note: the per-product lines only list what
            the recipe and supplier labels name. */}
        <p className="text-sm text-center leading-snug mt-6 max-w-2xl mx-auto" style={{ color: '#8B7A6B' }}>
          Notre fournil travaille aussi le sésame, les fruits à coque et les arachides&nbsp;:
          des traces sont possibles dans tous nos produits. En cas d’allergie, parlez-nous
          avant votre achat.{' '}
          <a
            href="/allergenes.pdf"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2"
            style={{ color: '#6E4D32' }}
          >
            Liste des allergènes (PDF)
          </a>
        </p>
      </div>
    </section>
  )
}
