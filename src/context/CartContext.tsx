import { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import type { SanityProduct } from '../types'

interface CartContextValue {
  cart: Record<string, number>
  addToCart: (productId: string) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: (products: SanityProduct[]) => number
}

const CartContext = createContext<CartContextValue>({
  cart: {},
  addToCart: () => {},
  removeFromCart: () => {},
  setQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: () => 0,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({})

  const addToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      const newQty = (next[productId] || 0) - 1
      if (newQty <= 0) {
        delete next[productId]
      } else {
        next[productId] = newQty
      }
      return next
    })
  }

  const setQuantity = (productId: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[productId]
      } else {
        next[productId] = Math.min(20, qty)
      }
      return next
    })
  }

  const clearCart = () => setCart({})

  const totalItems = useMemo(
    () => Object.values(cart).reduce((acc, q) => acc + q, 0),
    [cart]
  )

  const totalPrice = (products: SanityProduct[]) =>
    products.reduce((acc, p) => acc + (cart[p._id] || 0) * p.price, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, setQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
