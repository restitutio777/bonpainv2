import { useState, useEffect, useMemo, FormEvent } from 'react'
import { Info, ArrowRight, CheckCircle, Loader2, ChevronDown } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useSanity } from '../context/SanityContext'
import { useCart } from '../context/CartContext'
import { isByWeight, isOrderable, isPricedInStore, portionOf, priceLabel, unitPrice } from '../lib/productStatus'
import { addDays, formatDateFr, todayBrussels, unavailableReason, upcomingPickupDates } from '../lib/pickup'
import type { SanityProduct } from '../types'
import { orderEndpoint } from '../lib/orderApi'
import { openInstall } from '../lib/pwaInstall'
import { suggestEmail } from '../lib/emailTypos'

const FIELD_LABELS: Record<string, string> = {
  nom: 'le nom',
  prenom: 'le prénom',
  email: "l'adresse e-mail",
  tel: 'le numéro de téléphone',
  remarques: 'les remarques',
  jour: 'le jour de retrait',
  date: 'la date de retrait',
}

/** What the customer reads when /api/order did not take the order. */
type OrderError = {
  error?: string
  field?: string
  domain?: string
  leadDays?: number
  jour?: string
  product?: string
}

const UNTICK = 'décochez « Répéter cette commande chaque semaine »'

function orderErrorMessage(status: number, data: OrderError | null, phone: string) {
  const call = `Réessayez dans quelques minutes ou appelez-nous au ${phone}.`
  switch (data?.error) {
    case 'email_domain':
      return `L'adresse e-mail semble incorrecte : le domaine « ${data.domain} » n'existe pas. Vérifiez l'orthographe (par exemple gmail.com et non gmail.col).`
    case 'links':
      return 'Merci de ne pas indiquer de lien ou d’adresse web dans le nom, le prénom ou les remarques.'
    case 'invalid':
      return data.field && FIELD_LABELS[data.field]
        ? `Merci de vérifier ${FIELD_LABELS[data.field]}.`
        : 'Certaines informations semblent incorrectes. Merci de vérifier le formulaire.'
    case 'too_soon':
      return `Merci de prévoir au moins ${data.leadDays ?? 2} jours entre la commande et le retrait. Choisissez une date plus tardive ou appelez-nous au ${phone}.`
    case 'subscription_exists':
      return `Vous avez déjà une commande régulière le ${data.jour ?? 'même jour'}. Pour la modifier, utilisez le lien reçu par e-mail, ou ${UNTICK} pour une commande simple.`
    case 'saturday_only':
      return `${data.product ?? 'Ce produit'} n'est préparé que le samedi. Retirez-le pour une commande régulière de ce jour, ou ${UNTICK}.`
    case 'subscription_unavailable':
    case 'subscription_full':
      return `Les commandes régulières sont momentanément indisponibles. ${UNTICK.charAt(0).toUpperCase() + UNTICK.slice(1)} pour envoyer une commande simple, ou appelez-nous au ${phone}.`
    case 'products_changed':
      return 'Notre liste de pains vient de changer. Rechargez la page et refaites votre commande.'
    case 'rate_limited':
      return `Trop de commandes envoyées en peu de temps. ${call}`
    case 'daily_limit':
      return `Nous ne pouvons plus prendre de commande en ligne aujourd’hui. Appelez-nous au ${phone}.`
  }
  if (status === 429) return `Trop de commandes envoyées en peu de temps. ${call}`
  return `Votre commande n'a pas pu être transmise. ${call}`
}

// Order-form groups, in this order; products keep the studio order inside.
const GROUPS: { category: SanityProduct['category']; label: string }[] = [
  { category: 'bread', label: 'Pains' },
  { category: 'viennoiserie', label: 'Viennoiseries' },
  { category: 'tart', label: 'Tartes' },
  { category: 'specialty', label: 'Spécialités' },
]

// Calendar days of pickup dates shown at first, per "plus de dates", and at most.
const DATE_WINDOW = 14
const DATE_WINDOW_MAX = 56

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 font-display text-xl font-semibold mb-6 pb-3"
      style={{ color: '#2D1F14', borderBottom: '1px solid #F5EDE3' }}
    >
      <span
        className="font-body w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={{ background: '#A67C52', color: 'white' }}
        aria-hidden="true"
      >
        {n}
      </span>
      {children}
    </div>
  )
}

export default function OrderForm() {
  useScrollAnimation()
  const { products, content, settings, vacation, schedule } = useSanity()
  const { cart, setQuantity, clearCart, totalPrice } = useCart()

  const orderLeadDays = settings?.orderLeadDays || 2
  const isDisabled = vacation?.isActive && vacation?.disableOrdering

  // Step 1: the customer picks a pickup date first; step 2 then lists only
  // what is made for that day (season, Saturday-only), as the server does.
  const [date, setDate] = useState('')
  const [dateWindow, setDateWindow] = useState(DATE_WINDOW)
  const pickupDates = useMemo(
    () => upcomingPickupDates(schedule, orderLeadDays, vacation, dateWindow),
    [schedule, orderLeadDays, vacation, dateWindow]
  )
  const selected = pickupDates.find((d) => d.date === date) || null
  const jour = selected?.jour || ''

  // Without a date, the season is judged on today (cart from the product cards).
  const offered = products.filter((p) => p.orderInForm !== false)
  const orderItems = selected
    ? offered.filter((p) => !unavailableReason(p, selected.date))
    : offered.filter((p) => isOrderable(p))
  // Already in the cart but not made that day: shown, never sent.
  const notThatDay = selected
    ? offered
        .filter((p) => (cart[p._id] || 0) > 0 && unavailableReason(p, selected.date))
        .map((p) => ({ p, reason: unavailableReason(p, selected.date) as string }))
    : []
  const groups = GROUPS.map((g) => ({ ...g, items: orderItems.filter((p) => p.category === g.category) }))
    .concat({ category: 'bread', label: 'Autres', items: orderItems.filter((p) => !GROUPS.some((g) => g.category === p.category)) })
    .filter((g) => g.items.length > 0)

  const label = content?.orderLabel || 'Commander'
  const title = content?.orderTitle || 'Passez votre'
  const titleAccent = content?.orderTitleAccent || 'commande'
  const subtitle =
    content?.orderSubtitle ||
    "Choisissez vos pains, dites-nous quand vous passez, on s'occupe du reste."
  const orderNotice =
    content?.orderNotice ||
    `Pour les commandes, nous vous conseillons de réserver de préférence ${orderLeadDays} jours à l'avance afin de nous permettre de préparer chaque pain dans les meilleures conditions.`

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [remarques, setRemarques] = useState('')
  const [subscribe, setSubscribe] = useState(false)
  const [regular, setRegular] = useState<{ manageUrl: string; firstDate: string } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null)

  const phone = settings?.phone || '+32 493 21 09 25'

  useEffect(() => {
    if (submitSuccess) {
      document.getElementById('order')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [submitSuccess])

  const changeQty = (id: string, delta: number) => {
    const current = cart[id] || 0
    setQuantity(id, Math.min(20, Math.max(0, current + delta)))
  }

  // Only orderable products count — same predicate as the submitted payload.
  const total = totalPrice(orderItems)
  const hasByWeight = orderItems.some((p) => isByWeight(p) && (cart[p._id] || 0) > 0)
  const hasInStore = orderItems.some((p) => isPricedInStore(p) && (cart[p._id] || 0) > 0)
  const itemCount = orderItems.reduce((n, p) => n + (cart[p._id] || 0), 0)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (itemCount === 0) {
      setSubmitError('Votre panier est vide. Ajoutez au moins un produit avant d\u2019envoyer la commande.')
      return
    }

    if (!selected) {
      setSubmitError('Choisissez d\u2019abord le jour de retrait, tout en haut du formulaire.')
      document.getElementById('pickup-dates')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // A tab left open past midnight: the date may have become too close.
    if (selected.date < addDays(todayBrussels(), orderLeadDays)) {
      setDate('')
      setSubmitError(
        `Ce jour est désormais trop proche (${orderLeadDays} jours minimum). Choisissez une autre date de retrait.`
      )
      return
    }

    setSubmitting(true)

    const ordered = orderItems.filter((p) => (cart[p._id] || 0) > 0)

    const orderLines = ordered
      .map((p) => {
        if (isPricedInStore(p)) return `${cart[p._id]}x ${p.name} — prix en magasin`
        const label = isByWeight(p) ? `${p.name} (${portionOf(p)} g)` : p.name
        return `${cart[p._id]}x ${label} — €${(unitPrice(p) * cart[p._id]).toFixed(2).replace('.', ',')}`
      })
      .join('\n')

    const totalVal = totalPrice(ordered)

    try {
      const res = await fetch(orderEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { nom, prenom, email, tel },
          pickup: { jour, date },
          remarques,
          items: orderLines,
          total: totalVal,
          ...(subscribe ? { subscribe: true } : {}),
        }),
      })
      // Success only on the API's own answer: a host without the function
      // answers 200 with index.html, which must not read as "order sent".
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok === true) {
        setConfirmationSent(data.confirmation !== 'failed')
        setRegular(
          typeof data.manageUrl === 'string' && typeof data.firstDate === 'string'
            ? { manageUrl: data.manageUrl, firstDate: data.firstDate }
            : null
        )
        setSubmitSuccess(true)
        clearCart()
        // Best moment to suggest the home-screen icon: they just ordered and will again.
        setTimeout(() => openInstall('ordered'), 2500)
      } else {
        setSubmitError(orderErrorMessage(res.status, data, phone))
      }
    } catch {
      setSubmitError(`Erreur de connexion. Vérifiez votre connexion internet et réessayez, ou appelez-nous au ${phone}.`)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubmitSuccess(false)
    setConfirmationSent(true)
    setEmailSuggestion(null)
    setNom('')
    setPrenom('')
    setEmail('')
    setTel('')
    setDate('')
    setDateWindow(DATE_WINDOW)
    setRemarques('')
    setSubscribe(false)
    setRegular(null)
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
              {confirmationSent ? (
                <p
                  className="text-sm leading-[1.8] mb-8"
                  style={{ color: '#6E4D32', maxWidth: '440px', margin: '0 auto 2rem' }}
                >
                  Benjamin a bien reçu votre commande. La confirmation vient de partir à{' '}
                  <strong style={{ color: '#2D1F14', overflowWrap: 'anywhere' }}>{email}</strong>. Si elle
                  n&rsquo;arrive pas dans les minutes qui suivent, regardez dans vos courriers indésirables
                  (spam).
                </p>
              ) : (
                <p
                  role="alert"
                  className="text-sm leading-[1.8] mb-8"
                  style={{ color: '#6E4D32', maxWidth: '440px', margin: '0 auto 2rem' }}
                >
                  Benjamin a bien reçu votre commande, mais l&rsquo;e-mail de confirmation n&rsquo;a pas pu
                  être envoyé à{' '}
                  <strong style={{ color: '#2D1F14', overflowWrap: 'anywhere' }}>{email}</strong>. Si cette
                  adresse est incorrecte, appelez-nous au{' '}
                  <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ color: '#A67C52' }}>
                    {phone}
                  </a>{' '}
                  pour confirmer votre commande.
                </p>
              )}
              {regular && (
                <div
                  className="text-sm leading-[1.8] mb-8 mx-auto rounded-xl px-6 py-5"
                  style={{ color: '#6E4D32', maxWidth: '440px', background: '#FDF8F3', border: '1px solid #E8D9C8' }}
                >
                  <p className="mb-3">
                    <strong style={{ color: '#2D1F14' }}>Commande régulière enregistrée</strong> : chaque {jour}, prochain
                    retrait le {formatDateFr(regular.firstDate)}.{' '}
                    {confirmationSent
                      ? 'Le lien pour la modifier ou l’arrêter est dans l’e-mail.'
                      : 'Gardez ce lien : c’est votre accès pour la modifier ou l’arrêter.'}
                  </p>
                  <a
                    href={regular.manageUrl}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: '#A67C52' }}
                  >
                    <ArrowRight size={14} />
                    Gérer ma commande régulière
                  </a>
                </div>
              )}
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
                onSubmit={handleSubmit}
                className="rounded-[20px] p-5 sm:p-8 md:p-12 animate-on-scroll"
                style={{ background: 'white', boxShadow: '0 4px 16px rgba(45,31,20,0.08)' }}
              >
                <StepTitle n={1}>Quand passez-vous ?</StepTitle>

                <div id="pickup-dates" className="mb-10">
                  <div role="group" aria-label="Jour de retrait" className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {pickupDates.map((d) => {
                      const on = d.date === date
                      return (
                        <button
                          key={d.date}
                          type="button"
                          aria-pressed={on}
                          aria-label={formatDateFr(d.date)}
                          disabled={!!isDisabled}
                          onClick={() => {
                            setDate(d.date)
                            setSubmitError(null)
                          }}
                          className="flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={
                            on
                              ? { background: '#A67C52', color: 'white', border: '1px solid #A67C52', boxShadow: '0 4px 14px rgba(166,124,82,0.3)' }
                              : { background: '#FDF8F3', color: '#2D1F14', border: '1px solid #E8D9C8' }
                          }
                        >
                          <span className="text-xs uppercase tracking-wider" style={{ opacity: on ? 0.9 : 0.7 }}>
                            {d.weekdayShort}
                          </span>
                          <span className="font-display text-2xl leading-tight font-semibold" style={{ fontVariantNumeric: 'lining-nums' }}>
                            {d.dayNumber}
                          </span>
                          <span className="text-xs" style={{ opacity: on ? 0.9 : 0.7 }}>
                            {d.monthShort}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {pickupDates.length === 0 && (
                    <p className="text-sm" style={{ color: '#6E4D32' }}>
                      Aucun jour de retrait disponible pour le moment. Appelez-nous au {phone}.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-4">
                    <p className="text-sm leading-[1.6]" style={{ color: '#6E4D32' }} aria-live="polite">
                      {selected ? (
                        <>
                          Retrait le <strong style={{ color: '#2D1F14' }}>{formatDateFr(selected.date)}</strong>
                          {selected.hours && `, ${selected.hours}`}.
                        </>
                      ) : (
                        `Les dates tiennent compte du délai de ${orderLeadDays} jours pour préparer votre commande.`
                      )}
                    </p>
                    {dateWindow < DATE_WINDOW_MAX && pickupDates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDateWindow((w) => w + DATE_WINDOW)}
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: '#A67C52' }}
                      >
                        Plus de dates <ChevronDown size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <StepTitle n={2}>Vos pains</StepTitle>

                {!selected ? (
                  <div
                    className="mb-10 px-5 py-6 rounded-xl text-sm leading-[1.6] text-center"
                    style={{ background: '#FDF8F3', border: '1px dashed #D4BFA5', color: '#6E4D32' }}
                  >
                    {itemCount > 0
                      ? `Votre panier (${itemCount} article${itemCount > 1 ? 's' : ''}) vous attend : choisissez d’abord le jour de retrait.`
                      : 'Choisissez d’abord le jour de retrait : vous verrez ici ce que nous préparons ce jour-là.'}
                  </div>
                ) : (
                  <>
                    {notThatDay.length > 0 && (
                      <div
                        role="status"
                        className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 rounded-xl mb-6 text-sm leading-[1.6]"
                        style={{ background: '#FBF3EC', border: '1px solid #E8D9C8', color: '#6E4D32' }}
                      >
                        <Info size={16} className="flex-shrink-0" style={{ color: '#A67C52' }} />
                        <span className="flex-1">
                          Pas préparé le {formatDateFr(selected.date)} :{' '}
                          {notThatDay.map(({ p, reason }) => `${p.name} (${reason})`).join(', ')}. Ne sera pas commandé.
                        </span>
                        <button
                          type="button"
                          onClick={() => notThatDay.forEach(({ p }) => setQuantity(p._id, 0))}
                          className="self-start sm:self-auto text-xs font-semibold uppercase tracking-widest"
                          style={{ color: '#A67C52' }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-8 mb-10">
                      {groups.map((g) => (
                        <div key={g.label}>
                          {groups.length > 1 && (
                            <div className="text-xs font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: '#A67C52' }}>
                              {g.label}
                            </div>
                          )}
                          <div className="flex flex-col gap-3">
                            {g.items.map((item) => {
                              const hasInfo = !!item.description?.trim()
                              const isExpanded = expandedInfoId === item._id
                              return (
                                <div
                                  key={item._id}
                                  className="flex flex-col p-4 rounded-lg transition-colors duration-200"
                                  style={{ background: '#FDF8F3' }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = '#F5EDE3'
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = '#FDF8F3'
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <span className="block font-medium text-sm" style={{ color: '#2D1F14' }}>
                                        {item.name}
                                      </span>
                                      <span className="block text-xs mt-0.5" style={{ color: '#8B7A6B' }}>
                                        {priceLabel(item)}
                                        {item.availability === 'saturday' && ' · samedi'}
                                        {hasInfo && (
                                          <>
                                            {' · '}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedInfoId(isExpanded ? null : item._id)
                                              }
                                              aria-expanded={isExpanded}
                                              aria-controls={`info-${item._id}`}
                                              className="italic underline-offset-2 hover:underline transition-colors"
                                              style={{ color: '#A67C52' }}
                                            >
                                              {isExpanded ? 'fermer' : 'infos'}
                                            </button>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                    <div className="qty-control flex-shrink-0">
                                      <button
                                        type="button"
                                        className="qty-btn"
                                        onClick={() => changeQty(item._id, -1)}
                                        disabled={!!isDisabled}
                                        aria-label={`Retirer un ${item.name}`}
                                      >
                                        −
                                      </button>
                                      <input
                                        type="text"
                                        className="qty-value"
                                        value={cart[item._id] || 0}
                                        readOnly
                                        aria-label={`Quantité — ${item.name}`}
                                      />
                                      <button
                                        type="button"
                                        className="qty-btn"
                                        onClick={() => changeQty(item._id, 1)}
                                        disabled={!!isDisabled}
                                        aria-label={`Ajouter un ${item.name}`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  {hasInfo && isExpanded && (
                                    <div
                                      id={`info-${item._id}`}
                                      className="mt-3 pt-3 text-sm leading-[1.6]"
                                      style={{
                                        color: '#6E4D32',
                                        borderTop: '1px solid #E8D9C8',
                                        textWrap: 'pretty',
                                      }}
                                    >
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <StepTitle n={3}>Vos coordonnées</StepTitle>

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
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailSuggestion(null)
                      }}
                      className="px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={(e) => {
                        handleBlur(e)
                        setEmailSuggestion(suggestEmail(email))
                      }}
                      aria-describedby={emailSuggestion ? 'email-suggestion' : undefined}
                    />
                    {emailSuggestion && (
                      <p id="email-suggestion" role="status" className="text-xs leading-[1.6]" style={{ color: '#6E4D32' }}>
                        Vouliez-vous dire{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(emailSuggestion)
                            setEmailSuggestion(null)
                          }}
                          className="font-semibold underline underline-offset-2"
                          style={{ color: '#A67C52', overflowWrap: 'anywhere' }}
                        >
                          {emailSuggestion}
                        </button>{' '}
                        ?
                      </p>
                    )}
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

                {/* The wording mirrors CONSENT_TEXT in api/order.ts, stored with the regular order. */}
                <label
                  htmlFor="subscribe"
                  className="flex items-start gap-3 mb-8 px-5 py-4 rounded-xl cursor-pointer text-sm leading-[1.6]"
                  style={{ background: '#FBF3EC', border: '1px solid #E8D9C8', color: '#6E4D32' }}
                >
                  <input
                    id="subscribe"
                    type="checkbox"
                    checked={subscribe}
                    disabled={!!isDisabled}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="mt-1 w-4 h-4 flex-shrink-0"
                    style={{ accentColor: '#A67C52' }}
                  />
                  <span>
                    <strong style={{ color: '#2D1F14' }}>
                      Répéter cette commande chaque semaine
                      {jour ? `, le ${jour}` : ', le même jour'}
                    </strong>
                    , jusqu&rsquo;à ce que je l&rsquo;arrête.
                    <span className="block text-xs mt-1" style={{ color: '#8B7A6B' }}>
                      Sans engagement, payé à chaque retrait. Vous recevez un lien pour changer les quantités, sauter
                      une semaine ou arrêter. Suspendu automatiquement pendant nos congés.{' '}
                      <a href="/cgv" target="_blank" rel="noopener" style={{ color: '#A67C52' }}>
                        Conditions (CGV, art. 8)
                      </a>
                    </span>
                  </span>
                </label>

                {submitError && (
                  <div
                    role="alert"
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
                      {hasInStore && total === 0 ? 'prix en magasin' : `€ ${total.toFixed(2).replace('.', ',')}`}
                    </strong>
                    {hasInStore && total > 0 && (
                      <span className="font-body block text-xs mt-1" style={{ color: '#8B7A6B' }}>
                        + articles au prix du magasin, à régler sur place.
                      </span>
                    )}
                    {hasByWeight && (
                      <span className="font-body block text-xs mt-1" style={{ color: '#8B7A6B' }}>
                        Pains au kilo : coupés et pesés au retrait, le montant peut varier un peu.
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!!isDisabled || submitting || itemCount === 0}
                    className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: '#A67C52', boxShadow: '0 4px 20px rgba(166,124,82,0.3)', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !submitting && itemCount > 0)
                        (e.currentTarget as HTMLElement).style.background = '#8B6340'
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
