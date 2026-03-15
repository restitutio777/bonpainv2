import { useState, FormEvent } from 'react'
import { Info, ArrowRight, CheckCircle } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useSanity } from '../context/SanityContext'
import { useCart } from '../context/CartContext'

export default function OrderForm() {
  useScrollAnimation()
  const { products, content, settings, vacation } = useSanity()
  const { cart, setQuantity, clearCart, totalPrice } = useCart()

  const orderItems = products.filter((p) => p.orderInForm)
  const orderLeadDays = settings?.orderLeadDays || 2
  const isDisabled = vacation?.isActive && vacation?.disableOrdering

  const label = content?.orderLabel || 'Commander'
  const title = content?.orderTitle || 'Passez votre'
  const titleAccent = content?.orderTitleAccent || 'commande'
  const subtitle = content?.orderSubtitle || "Sélectionnez vos pains, indiquez vos coordonnées, et nous préparons tout pour le jour de retrait choisi."
  const orderNotice = content?.orderNotice || `Toute commande doit être passée au minimum ${orderLeadDays} jours à l'avance. Nous ne cuisons que ce qui a été commandé — merci de votre compréhension.`

  const [submitted, setSubmitted] = useState(false)

  const changeQty = (id: string, delta: number) => {
    const current = cart[id] || 0
    setQuantity(id, Math.min(20, Math.max(0, current + delta)))
  }

  const total = totalPrice(products)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section
      id="order"
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
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D1F14' }}
          >
            {title}{' '}
            <em className="not-italic italic" style={{ color: '#A67C52' }}>
              {titleAccent}
            </em>
          </h2>
          <p className="text-base leading-[1.7]" style={{ color: '#8B7A6B' }}>
            {subtitle}
          </p>
        </div>

        <div className="max-w-[800px] mx-auto">
          {submitted && (
            <div
              className="rounded-[20px] p-12 text-center animate-on-scroll visible"
              style={{ background: 'white', boxShadow: '0 4px 16px rgba(45,31,20,0.08)' }}
            >
              <div
                className="w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #FDF8F3, #F5EDE3)', color: '#A67C52' }}
              >
                <CheckCircle size={32} />
              </div>
              <h3 className="font-display text-2xl font-normal mb-3" style={{ color: '#2D1F14' }}>
                Commande envoyée !
              </h3>
              <p className="text-sm leading-[1.8] mb-8" style={{ color: '#6E4D32', maxWidth: '420px', margin: '0 auto 2rem' }}>
                Merci pour votre commande. Nous vous confirmerons par e-mail ou téléphone dans les plus brefs délais.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  clearCart()
                }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300"
                style={{ background: '#FDF8F3', color: '#A67C52', border: '1px solid #E8D9C8' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5EDE3' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FDF8F3' }}
              >
                Nouvelle commande
              </button>
            </div>
          )}

          {!submitted && (
            <>
              {isDisabled && (
                <div
                  className="flex items-start gap-4 px-6 py-5 rounded-xl mb-10 text-sm leading-[1.6] animate-on-scroll"
                  style={{ background: 'linear-gradient(135deg, #6E4D32, #4A3321)', color: '#F5EDE3' }}
                >
                  <Info size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#D4A373' }} />
                  <div>
                    <strong>Commandes désactivées</strong> pendant la période de vacances.
                  </div>
                </div>
              )}

              {!isDisabled && (
                <div
                  className="flex items-start gap-4 px-6 py-5 rounded-xl mb-10 text-sm leading-[1.6] animate-on-scroll"
                  style={{ background: 'linear-gradient(135deg, #6E4D32, #4A3321)', color: '#F5EDE3' }}
                >
                  <Info size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#D4A373' }} />
                  <div>
                    <strong>Important :</strong> {orderNotice}
                  </div>
                </div>
              )}

              <form
                id="orderForm"
                onSubmit={handleSubmit}
                className="rounded-[20px] p-8 md:p-12 animate-on-scroll"
                style={{ background: 'white', boxShadow: '0 4px 16px rgba(45,31,20,0.08)' }}
              >
                <div
                  className="font-display text-xl font-semibold mb-6 pb-3"
                  style={{ color: '#2D1F14', borderBottom: '1px solid #F5EDE3' }}
                >
                  Vos pains
                </div>

                <div className="flex flex-col gap-3 mb-10">
                  {orderItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg gap-3 transition-colors duration-200"
                      style={{ background: '#FDF8F3' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#F5EDE3'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#FDF8F3'
                      }}
                    >
                      <div>
                        <span className="font-medium text-sm" style={{ color: '#2D1F14' }}>
                          {item.name}
                        </span>
                        <span className="text-xs ml-2" style={{ color: '#8B7A6B' }}>
                          — €{item.price.toFixed(2).replace('.', ',')}
                          {item.availability === 'saturday' && (
                            <em className="not-italic ml-1 text-xs" style={{ color: '#8B7A6B' }}>
                              (sam.)
                            </em>
                          )}
                        </span>
                      </div>
                      <div className="qty-control self-end sm:self-auto">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => changeQty(item._id, -1)}
                          disabled={!!isDisabled}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          className="qty-value"
                          value={cart[item._id] || 0}
                          readOnly
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => changeQty(item._id, 1)}
                          disabled={!!isDisabled}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="font-display text-xl font-semibold mb-6 pb-3"
                  style={{ color: '#2D1F14', borderBottom: '1px solid #F5EDE3' }}
                >
                  Vos coordonnées
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  {[
                    { id: 'nom', label: 'Nom *', type: 'text', placeholder: 'Votre nom', required: true },
                    { id: 'prenom', label: 'Prénom *', type: 'text', placeholder: 'Votre prénom', required: true },
                    { id: 'email', label: 'Email *', type: 'email', placeholder: 'votre@email.be', required: true },
                    { id: 'tel', label: 'Téléphone', type: 'tel', placeholder: '+32 ...', required: false },
                  ].map((field) => (
                    <div key={field.id} className="flex flex-col gap-1.5">
                      <label
                        htmlFor={field.id}
                        className="text-xs font-semibold tracking-wide"
                        style={{ color: '#6E4D32' }}
                      >
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        id={field.id}
                        name={field.id}
                        required={field.required}
                        placeholder={field.placeholder}
                        className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{ border: '1px solid #E8D9C8', background: '#FDF8F3', color: '#2D1F14', fontFamily: 'inherit' }}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#A67C52'
                          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(166,124,82,0.1)'
                          ;(e.currentTarget as HTMLElement).style.background = 'white'
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#E8D9C8'
                          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                          ;(e.currentTarget as HTMLElement).style.background = '#FDF8F3'
                        }}
                      />
                    </div>
                  ))}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jour" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Jour de retrait *
                    </label>
                    <select
                      id="jour"
                      name="jour"
                      required
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{ border: '1px solid #E8D9C8', background: '#FDF8F3', color: '#2D1F14', fontFamily: 'inherit' }}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#A67C52'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(166,124,82,0.1)'
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#E8D9C8'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      }}
                    >
                      <option value="">Choisir un jour...</option>
                      <option value="mercredi">Mercredi</option>
                      <option value="vendredi">Vendredi</option>
                      <option value="samedi">Samedi</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="date" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Date souhaitée *
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      required
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{ border: '1px solid #E8D9C8', background: '#FDF8F3', color: '#2D1F14', fontFamily: 'inherit' }}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#A67C52'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(166,124,82,0.1)'
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#E8D9C8'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-8">
                  <label htmlFor="remarques" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                    Remarques
                  </label>
                  <textarea
                    id="remarques"
                    name="remarques"
                    placeholder="Allergies, préférences, questions..."
                    rows={4}
                    className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 resize-y"
                    style={{ border: '1px solid #E8D9C8', background: '#FDF8F3', color: '#2D1F14', fontFamily: 'inherit', minHeight: '100px' }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#A67C52'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(166,124,82,0.1)'
                      ;(e.currentTarget as HTMLElement).style.background = 'white'
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#E8D9C8'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      ;(e.currentTarget as HTMLElement).style.background = '#FDF8F3'
                    }}
                  />
                </div>

                <div
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
                  style={{ borderTop: '1px solid #F5EDE3' }}
                >
                  <div className="font-display text-xl" style={{ color: '#2D1F14' }}>
                    Total :{' '}
                    <strong style={{ color: '#A67C52' }}>
                      € {total.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                  <button
                    type="submit"
                    disabled={!!isDisabled}
                    className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: '#A67C52', boxShadow: '0 4px 20px rgba(166,124,82,0.3)', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) (e.currentTarget as HTMLElement).style.background = '#8B6340'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#A67C52'
                    }}
                  >
                    <ArrowRight size={18} />
                    Envoyer la commande
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
