import { Plus, Calendar } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { products } from '../data/products';

export default function Products() {
  useScrollAnimation();

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
            Nos pains
          </div>
          <h2
            className="font-display font-normal leading-[1.15] mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D1F14' }}
          >
            Cuits au feu de bois,{' '}
            <em className="not-italic italic" style={{ color: '#A67C52' }}>
              avec amour
            </em>
          </h2>
          <p className="text-base leading-[1.7]" style={{ color: '#8B7A6B' }}>
            Chaque produit est réalisé à partir de levain naturel et de farines sélectionnées.
            Commande minimum 2 jours à l'avance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="animate-on-scroll bg-white rounded-xl overflow-hidden cursor-pointer group transition-all duration-400"
              style={{
                transitionDelay: `${(i % 3) * 0.1}s`,
                boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(-6px)';
                card.style.boxShadow = '0 8px 32px rgba(45,31,20,0.1)';
                const img = card.querySelector('img');
                if (img) img.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)';
                const img = card.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <div className="overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700"
                  style={{ transform: 'scale(1)' }}
                />
                {product.badge && (
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                    style={{
                      background: 'rgba(45,31,20,0.75)',
                      backdropFilter: 'blur(8px)',
                      color: '#F5EDE3',
                    }}
                  >
                    {product.badge}
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3
                  className="font-display text-xl font-medium mb-1.5"
                  style={{ color: '#2D1F14' }}
                >
                  {product.name}
                </h3>
                <p className="text-sm leading-[1.5]" style={{ color: '#8B7A6B' }}>
                  {product.description}
                </p>
                <div
                  className="flex items-center justify-between mt-4 pt-4"
                  style={{ borderTop: '1px solid #F5EDE3' }}
                >
                  <span
                    className="font-display text-lg font-semibold"
                    style={{ color: '#A67C52' }}
                  >
                    € {product.price.toFixed(2).replace('.', ',')}
                  </span>
                  <a
                    href="#order"
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
                    style={{
                      background: '#FDF8F3',
                      border: '1px solid #E8D9C8',
                      color: '#A67C52',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#A67C52';
                      (e.currentTarget as HTMLElement).style.color = 'white';
                      (e.currentTarget as HTMLElement).style.borderColor = '#A67C52';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#FDF8F3';
                      (e.currentTarget as HTMLElement).style.color = '#A67C52';
                      (e.currentTarget as HTMLElement).style.borderColor = '#E8D9C8';
                    }}
                    aria-label={`Commander ${product.name}`}
                  >
                    <Plus size={18} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-center gap-2 mt-10 px-6 py-3.5 rounded-xl animate-on-scroll"
          style={{
            background: 'white',
            border: '1px dashed #D4BFA5',
          }}
        >
          <Calendar size={16} style={{ color: '#A67C52' }} />
          <span className="text-sm" style={{ color: '#6E4D32' }}>
            <strong>Samedi uniquement :</strong> Croissants et pains au chocolat disponibles sur
            commande.
          </span>
        </div>
      </div>
    </section>
  );
}
