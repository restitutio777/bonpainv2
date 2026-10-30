import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle, Info, Loader2 } from 'lucide-react'
import LegalLayout from './legal/LegalLayout'
import { useSanity } from '../context/SanityContext'
import { getProductStatus, isByWeight, priceLabel, unitPrice } from '../lib/productStatus'
import { subscriptionEndpoint } from '../lib/orderApi'

// Management page for a regular order, opened from the personal link in the
// emails: /abonnement#<id>.<token> (customer) or #b.<id>.<token> (bakery).
// The token stays in the fragment, so it never reaches a server log. Every
// change is a POST to /api/subscription (see there).

type DateState = 'planned' | 'skipped' | 'vacation' | 'no-sales-day' | 'nothing-available'

type SubView = {
  role: 'customer' | 'bakery'
  status: 'active' | 'ended'
  weekday: string
  customer: { nom: string; prenom: string; email: string; tel?: string }
  items: { id: string; name: string; qty: number; offered: boolean }[]
  remarques: string
  firstOrderDate: string
  dates: { date: string; state: DateState; locked: boolean }[]
  leadDays: number
  earliest: string
  endedAt?: string
  endedBy?: 'customer' | 'bakery'
  mail?: 'sent' | 'failed' | 'none'
  stillPlanned?: string[]
}

const dateFr = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Intl.DateTimeFormat('fr-BE', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))

const BOX = { background: 'white', boxShadow: '0 4px 16px rgba(45,31,20,0.08)' }
const MUTED = '#8B7A6B'

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] p-6 md:p-8 mb-6" style={BOX}>
      {title && (
        <h2 className="font-display text-xl font-medium mb-4" style={{ color: '#2D1F14' }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

function Notice({ tone = 'info', children }: { tone?: 'info' | 'ok'; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 px-5 py-4 rounded-xl mb-6 text-sm leading-[1.6]"
      style={{ background: tone === 'ok' ? '#EEF3EA' : '#FBF3EC', border: '1px solid #E8D9C8', color: '#6E4D32' }}
    >
      {tone === 'ok' ? (
        <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#5F7F4E' }} />
      ) : (
        <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#A67C52' }} />
      )}
      <div>{children}</div>
    </div>
  )
}

const ERRORS: Record<string, string> = {
  not_found:
    "Ce lien n'est pas (ou plus) valable. Vérifiez que vous avez ouvert le lien complet depuis l'e-mail de confirmation.",
  unavailable: 'Le service est momentanément indisponible. Réessayez dans quelques minutes.',
  rate_limited: 'Trop de demandes en peu de temps. Réessayez dans un moment.',
  ended: 'Cette commande régulière est déjà arrêtée.',
  products_changed: 'Notre liste de pains vient de changer. Rechargez la page et refaites votre modification.',
  invalid: 'Certaines informations semblent incorrectes. Vérifiez vos choix.',
  forbidden: "Cette action n'est pas possible depuis ce lien.",
}

export default function Subscription() {
  const { products, settings } = useSanity()
  const phone = settings?.phone || '+32 493 21 09 25'
  const [ref] = useState(() => window.location.hash.slice(1))
  const [view, setView] = useState<SubView | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'ok'; text: string } | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  // Editable copy of the regular order.
  const [qty, setQty] = useState<Record<string, number>>({})
  const [skips, setSkips] = useState<Set<string>>(new Set())
  const [remarques, setRemarques] = useState('')

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex, nofollow'
  }, [])

  const adopt = (v: SubView) => {
    setView(v)
    setQty(Object.fromEntries(v.items.map((i) => [i.id, i.qty])))
    setSkips(new Set(v.dates.filter((d) => d.state === 'skipped').map((d) => d.date)))
    setRemarques(v.remarques)
  }

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch(subscriptionEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, ...body }),
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, data }
  }

  useEffect(() => {
    if (!ref) {
      setLoadError(ERRORS.not_found)
      return
    }
    post({ action: 'get' })
      .then(({ ok, data }) => (ok && data?.weekday ? adopt(data) : setLoadError(ERRORS[data?.error] ?? ERRORS.unavailable)))
      .catch(() => setLoadError('Erreur de connexion. Vérifiez votre connexion internet et réessayez.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  // Products the customer can choose for this weekday: everything offered in
  // the form, Saturday-only bread only on Saturdays, plus what the regular
  // order already holds (so a product taken off the list can be removed).
  const choices = useMemo(() => {
    if (!view) return []
    const offered = products.filter(
      (p) => p.orderInForm !== false && (p.availability !== 'saturday' || view.weekday === 'samedi')
    )
    const extra = view.items.filter((i) => !offered.some((p) => p._id === i.id))
    return [
      ...offered.map((p) => ({ id: p._id, name: p.name, price: unitPrice(p), byWeight: isByWeight(p), label: priceLabel(p), note: getProductStatus(p).badge, offered: true })),
      ...extra.map((i) => ({ id: i.id, name: i.name, price: 0, byWeight: false, label: '', note: "N'est plus proposé", offered: false })),
    ]
  }, [products, view])

  const priceOf = (id: string) => choices.find((c) => c.id === id)?.price ?? 0
  const hasByWeight = choices.some((c) => c.byWeight && (qty[c.id] || 0) > 0)
  const weekTotal = Object.entries(qty).reduce((s, [id, n]) => s + priceOf(id) * n, 0)
  const itemCount = Object.values(qty).reduce((s, n) => s + n, 0)
  const unofferedLeft = choices.some((c) => !c.offered && (qty[c.id] || 0) > 0)

  const dirty = useMemo(() => {
    if (!view) return false
    const now = Object.entries(qty).filter(([, n]) => n > 0).sort()
    const was = view.items.map((i) => [i.id, i.qty] as [string, number]).sort()
    const skipNow = [...skips].sort().join()
    const skipWas = view.dates.filter((d) => d.state === 'skipped').map((d) => d.date).sort().join()
    return JSON.stringify(now) !== JSON.stringify(was) || skipNow !== skipWas || remarques.trim() !== view.remarques
  }, [qty, skips, remarques, view])

  const change = (id: string, delta: number) =>
    setQty((q) => ({ ...q, [id]: Math.min(20, Math.max(0, (q[id] || 0) + delta)) }))

  const toggleSkip = (date: string) =>
    setSkips((s) => {
      const next = new Set(s)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const items = Object.entries(qty)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => ({ id, qty: n }))
      const { ok, data } = await post({ action: 'update', items, skipDates: [...skips], remarques })
      if (ok && data?.weekday) {
        adopt(data)
        setMessage({
          tone: 'ok',
          text:
            data.mail === 'failed'
              ? "Modifications enregistrées. L'e-mail de confirmation n'a pas pu être envoyé, mais tout est bien pris en compte."
              : 'Modifications enregistrées. Vous recevez une confirmation par e-mail.',
        })
      } else {
        setMessage({ tone: 'info', text: ERRORS[data?.error] ?? ERRORS.unavailable })
      }
    } catch {
      setMessage({ tone: 'info', text: 'Erreur de connexion. Rien n’a été modifié, réessayez.' })
    } finally {
      setBusy(false)
    }
  }

  const end = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const { ok, data } = await post({ action: 'end' })
      if (ok && data?.weekday) {
        adopt(data)
        setConfirmEnd(false)
        const planned = (data.stillPlanned as string[] | undefined) ?? []
        setMessage({
          tone: 'ok',
          text:
            view?.role === 'bakery'
              ? 'Commande régulière arrêtée. Le client est prévenu par e-mail.'
              : `Votre commande régulière est arrêtée.${
                  planned.length
                    ? ` La commande du ${planned.map((d) => dateFr(d)).join(', ')} était déjà transmise et reste prévue. Pour l'annuler, appelez-nous au ${phone}.`
                    : ''
                }`,
        })
      } else {
        setMessage({ tone: 'info', text: ERRORS[data?.error] ?? ERRORS.unavailable })
      }
    } catch {
      setMessage({ tone: 'info', text: 'Erreur de connexion, réessayez.' })
    } finally {
      setBusy(false)
    }
  }

  const isBakery = view?.role === 'bakery'
  const active = view?.status === 'active'

  const stateLabel = (d: SubView['dates'][number]) => {
    switch (d.state) {
      case 'vacation':
        return 'Fermé (congés), pas de commande'
      case 'no-sales-day':
        return "Ce jour n'est plus un jour de vente"
      case 'nothing-available':
        return 'Vos produits ne sont pas préparés ce jour'
      default:
        return null
    }
  }

  return (
    <LegalLayout title={isBakery ? 'Commande régulière' : 'Votre commande régulière'} description="Gérer une commande régulière chez Bon Pain Fait Main.">
      {!view && !loadError && (
        <div className="flex items-center gap-3 text-sm" style={{ color: MUTED }}>
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      )}

      {loadError && (
        <Notice>
          {loadError} Une question ? Appelez-nous au{' '}
          <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ color: '#A67C52' }}>
            {phone}
          </a>
          .
        </Notice>
      )}

      {view && (
        <>
          {message && <Notice tone={message.tone}>{message.text}</Notice>}

          <Card>
            <p className="font-display text-2xl mb-2" style={{ color: '#2D1F14' }}>
              Chaque {view.weekday}
            </p>
            <p className="text-sm leading-[1.7]" style={{ color: '#6E4D32' }}>
              {view.customer.prenom} {view.customer.nom}
              {isBakery && (
                <>
                  {' · '}
                  <a href={`mailto:${view.customer.email}`} style={{ color: '#A67C52' }}>
                    {view.customer.email}
                  </a>
                  {view.customer.tel && (
                    <>
                      {' · '}
                      <a href={`tel:${view.customer.tel.replace(/\s/g, '')}`} style={{ color: '#A67C52' }}>
                        {view.customer.tel}
                      </a>
                    </>
                  )}
                </>
              )}
              <br />
              <span style={{ color: MUTED }}>Première commande le {dateFr(view.firstOrderDate)}.</span>
            </p>
            {!active && (
              <p className="text-sm mt-4 font-semibold" style={{ color: '#B22222' }}>
                Arrêtée{view.endedAt ? ` le ${dateFr(view.endedAt.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                {view.endedBy === 'bakery' ? ' par la boulangerie' : ''}. Elle n&rsquo;est plus préparée.
              </p>
            )}
          </Card>

          {active && !isBakery && (
            <>
              <Card title="Vos pains, chaque semaine">
                <ul className="divide-y" style={{ borderColor: '#F5EDE3' }}>
                  {choices.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="text-sm">
                        <span className="font-medium" style={{ color: c.offered ? '#2D1F14' : MUTED }}>
                          {c.name}
                        </span>
                        {c.offered && c.price > 0 && (
                          <span className="text-xs ml-2" style={{ color: MUTED }}>
                            {c.label}
                          </span>
                        )}
                        {c.note && (
                          <span className="block text-xs" style={{ color: MUTED }}>
                            {c.note}
                          </span>
                        )}
                      </div>
                      <div className="qty-control flex-shrink-0">
                        <button type="button" className="qty-btn" onClick={() => change(c.id, -1)} aria-label={`Retirer un ${c.name}`}>
                          −
                        </button>
                        <span className="qty-value flex items-center justify-center h-9" aria-live="polite">
                          {qty[c.id] || 0}
                        </span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => change(c.id, 1)}
                          disabled={!c.offered}
                          aria-label={`Ajouter un ${c.name}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-sm mt-4" style={{ color: '#6E4D32' }}>
                  Total par semaine : <strong>€{weekTotal.toFixed(2).replace('.', ',')}</strong>
                  {hasByWeight && ' environ'}{' '}
                  <span style={{ color: MUTED }}>(prix du jour, payé au retrait)</span>
                </p>
                {unofferedLeft && (
                  <p className="text-xs mt-2" style={{ color: '#B22222' }}>
                    Un produit n&rsquo;est plus proposé : mettez-le à 0 pour enregistrer.
                  </p>
                )}
              </Card>

              <Card title="Les prochaines semaines">
                <p className="text-sm mb-4" style={{ color: '#6E4D32' }}>
                  Décochez une semaine où vous ne venez pas. Les changements sont possibles jusqu&rsquo;à{' '}
                  {view.leadDays} jours avant le retrait.
                </p>
                <ul className="divide-y" style={{ borderColor: '#F5EDE3' }}>
                  {view.dates.map((d) => {
                    const label = stateLabel(d)
                    const editable = !d.locked && (d.state === 'planned' || d.state === 'skipped')
                    const coming = !skips.has(d.date)
                    return (
                      <li key={d.date} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <span style={{ color: label ? MUTED : '#2D1F14' }} className="first-letter:uppercase">
                          {dateFr(d.date)}
                        </span>
                        {label ? (
                          <span className="text-xs text-right" style={{ color: MUTED }}>
                            {label}
                          </span>
                        ) : d.locked ? (
                          <span className="text-xs text-right" style={{ color: MUTED }}>
                            {d.state === 'skipped' ? 'Pas de retrait' : 'Commande transmise'} · pour changer, appelez-nous
                          </span>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: '#6E4D32' }}>
                            <input
                              type="checkbox"
                              checked={coming}
                              disabled={!editable}
                              onChange={() => toggleSkip(d.date)}
                              aria-label={`Je viens le ${dateFr(d.date)}`}
                              className="w-4 h-4"
                              style={{ accentColor: '#A67C52' }}
                            />
                            {coming ? 'Je viens' : 'Pas cette semaine'}
                          </label>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Card>

              <Card title="Remarque">
                <textarea
                  rows={3}
                  value={remarques}
                  onChange={(e) => setRemarques(e.target.value)}
                  maxLength={1000}
                  placeholder="Par exemple : tranché, bien cuit…"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #E8D9C8', background: '#FDF8F3', color: '#2D1F14' }}
                />
              </Card>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
                <span className="text-xs" style={{ color: MUTED }}>
                  {itemCount === 0 ? 'Choisissez au moins un pain, ou arrêtez la commande régulière plus bas.' : ''}
                </span>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy || !dirty || itemCount === 0 || unofferedLeft}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#A67C52', fontFamily: 'inherit' }}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  Enregistrer
                </button>
              </div>
            </>
          )}

          {active && isBakery && (
            <Card title="Commande">
              <ul className="text-sm mb-4" style={{ color: '#2D1F14' }}>
                {view.items.map((i) => (
                  <li key={i.id}>
                    {i.qty}× {i.name}
                    {!i.offered && <span style={{ color: MUTED }}> (n&rsquo;est plus proposé)</span>}
                  </li>
                ))}
              </ul>
              {view.remarques && (
                <p className="text-sm italic mb-4" style={{ color: '#6E4D32' }}>
                  Remarque : {view.remarques}
                </p>
              )}
              <ul className="text-xs" style={{ color: MUTED }}>
                {view.dates.slice(0, 6).map((d) => (
                  <li key={d.date}>
                    {dateFr(d.date)} :{' '}
                    {d.state === 'planned' ? 'prévu' : d.state === 'skipped' ? 'le client ne vient pas' : stateLabel(d)}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {active && (
            <Card title={isBakery ? 'Arrêter cette commande régulière' : 'Arrêter'}>
              <p className="text-sm mb-4" style={{ color: '#6E4D32' }}>
                {isBakery
                  ? 'Elle ne sera plus préparée. Le client est prévenu par e-mail.'
                  : `Votre commande ne sera plus préparée. Une commande déjà transmise (moins de ${view.leadDays} jours avant le retrait) reste prévue.`}
              </p>
              {!confirmEnd ? (
                <button
                  type="button"
                  onClick={() => setConfirmEnd(true)}
                  className="px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest"
                  style={{ background: '#FDF8F3', color: '#A67C52', border: '1px solid #E8D9C8' }}
                >
                  {isBakery ? 'Arrêter' : 'Arrêter ma commande régulière'}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: '#2D1F14' }}>
                    Vraiment arrêter ?
                  </span>
                  <button
                    type="button"
                    onClick={end}
                    disabled={busy}
                    className="px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50"
                    style={{ background: '#B22222' }}
                  >
                    Oui, arrêter
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmEnd(false)}
                    className="px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest"
                    style={{ color: '#6E4D32' }}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </Card>
          )}

          <p className="text-xs leading-[1.7]" style={{ color: MUTED }}>
            Conditions : <a href="/cgv" style={{ color: '#A67C52' }}>CGV, article 8</a>. Une question ? Répondez à l&rsquo;un de
            nos e-mails ou appelez le{' '}
            <a href={`tel:${phone.replace(/\s/g, '')}`} style={{ color: '#A67C52' }}>
              {phone}
            </a>
            .
          </p>
        </>
      )}
    </LegalLayout>
  )
}
