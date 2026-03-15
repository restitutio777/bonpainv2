import { useState, FormEvent } from 'react'
import { Info, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
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

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [jour, setJour] = useState('')
  const [date, setDate] = useState('')
  const [remarques, setRemarques] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const changeQty = (id: string, delta: number) => {
    const current = cart[id] || 0
    setQuantity(id, Math.min(20, Math.max(0, current + delta)))
  }

  const total = totalPrice(products)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    const orderLines = products
      .filter((p) => p.orderInForm && (cart[p._id] || 0) > 0)
      .map((p) => `${cart[p._id]}x ${p.name} — €${(p.price * cart[p._id]).toFixed(2).replace('.', ',')}`)
      .join('\n')

    const totalVal = products
      .filter((p) => p.orderInForm && (cart[p._id] || 0) > 0)
      .reduce((sum, p) => sum + p.price * (cart[p._id] || 0), 0)

    const formData = new URLSearchParams()
    formData.append('form-name', 'order')
    formData.append('nom', nom)
    formData.append('prenom', prenom)
    formData.append('email', email)
    formData.append('tel', tel)
    formData.append('jour', jour)
    formData.append('date', date)
    formData.append('remarques', remarques)
    formData.append('commande', orderLines)
    formData.append('total', `€${totalVal.toFixed(2).replace('.', ',')}`)

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
      if (res.ok) {
        setSubmitSuccess(true)
        clearCart()
      } else {
        setSubmitError('Une erreur est survenue. Veuillez réessayer.')
      }
    } catch {
      setSubmitError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubmitSuccess(false)
    setNom('')
    setPrenom('')
    setEmail('')
    setTel('')
    setJour('')
    setDate('')
    setRemarques('')
    clearCart()
  }

  const inputStyle = {
    border: '1px solid #E8D9C8',
    background: '#FDF8F3',
    color: '#2D1F14',
    fontFamily: 'inherit',
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const el = e.currentTarget as HTMLElement
    el.style.borderColor = '#A67C52'
    el.style.boxShadow = '0 0 0 3px rgba(166,124,82,0.1)'
    el.style.background = 'white'
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const el = e.currentTarget as HTMLElement
    el.style.borderColor = '#E8D9C8'
    el.style.boxShadow = 'none'
    el.style.background = '#FDF8F3'
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
          {submitSuccess && (
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
                Merci pour votre commande !
              </h3>
              <p
                className="text-sm leading-[1.8] mb-8"
                style={{ color: '#6E4D32', maxWidth: '420px', margin: '0 auto 2rem' }}
              >
                Benjamin a bien reçu votre commande. Vous recevrez une confirmation par email.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300"
                style={{ background: '#FDF8F3', color: '#A67C52', border: '1px solid #E8D9C8' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5EDE3' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FDF8F3' }}
              >
                Nouvelle commande
              </button>
            </div>
          )}

          {!submitSuccess && (
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
                name="order"
                onSubmit={handleSubmit}
                className="rounded-[20px] p-8 md:p-12 animate-on-scroll"
                style={{ background: 'white', boxShadow: '0 4px 16px rgba(45,31,20,0.08)' }}
              >
                <input type="hidden" name="form-name" value="order" />

                <p className="hidden">
                  <label>Ne pas remplir : <input name="bot-field" /></label>
                </p>

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
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nom" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      required
                      placeholder="Votre nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="prenom" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      required
                      placeholder="Votre prénom"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="votre@email.be"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tel" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="tel"
                      name="tel"
                      placeholder="+32 ..."
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jour" className="text-xs font-semibold tracking-wide" style={{ color: '#6E4D32' }}>
                      Jour de retrait *
                    </label>
                    <select
                      id="jour"
                      name="jour"
                      required
                      value={jour}
                      onChange={(e) => setJour(e.target.value)}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
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
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
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
                    value={remarques}
                    onChange={(e) => setRemarques(e.target.value)}
                    className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 resize-y"
                    style={{ ...inputStyle, minHeight: '100px' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {submitError && (
                  <div
                    className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 text-sm"
                    style={{ background: '#FBF3EC', border: '1px solid #E8D9C8', color: '#6E4D32' }}
                  >
                    <Info size={16} className="flex-shrink-0" style={{ color: '#A67C52' }} />
                    {submitError}
                  </div>
                )}

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
                    disabled={!!isDisabled || submitting}
                    className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: '#A67C52', boxShadow: '0 4px 20px rgba(166,124,82,0.3)', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !submitting) (e.currentTarget as HTMLElement).style.background = '#8B6340'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#A67C52'
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <ArrowRight size={18} />
                        Envoyer la commande
                      </>
                    )}
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
