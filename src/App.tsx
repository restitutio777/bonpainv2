import { useState, useEffect } from 'react';
import VacationBanner from './components/VacationBanner';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Products from './components/Products';
import Info from './components/Info';
import OrderForm from './components/OrderForm';
import Footer from './components/Footer';
import Modal from './components/Modal';
import MentionsLegales from './components/legal/MentionsLegales';
import Confidentialite from './components/legal/Confidentialite';
import CGV from './components/legal/CGV';

const panettoneContent = {
  fr: {
    title: 'Panettone de Pâques',
    subtitle: 'Édition saisonnière — disponible sur commande',
    body: [
      "Notre panettone est préparé selon la méthode traditionnelle italienne, avec un levain naturel longuement fermenté. Fruits confits, beurre de qualité, et une mie aérienne et filante.",
      "Commandez au moins 4 jours à l'avance. Disponible uniquement pendant la période pascale.",
    ],
  },
  de: {
    title: 'Oster-Panettone',
    subtitle: 'Saisonale Ausgabe — auf Bestellung erhältlich',
    body: [
      "Unser Panettone wird nach traditioneller italienischer Methode mit lang fermentiertem Natursauerteig hergestellt. Kandierte Früchte, hochwertige Butter und ein luftiger, fadenziehender Teig.",
      "Bitte mindestens 4 Tage im Voraus bestellen. Nur während der Osterzeit erhältlich.",
    ],
  },
};

const pizzaContent = {
  fr: {
    title: 'Bases de pizza',
    subtitle: 'Pré-cuites, fermentées 12h',
    body: [
      "Nos bases de pizza sont réalisées avec la même pâte au levain que nos pains, fermentée 12 heures minimum. Pré-cuites et garnies d'une base tomate-parmesan, il ne vous reste qu'à ajouter vos garnitures préférées et passer au four 8 à 10 minutes.",
      "Disponibles sur commande — merci de préciser la quantité souhaitée dans le formulaire.",
    ],
  },
  de: {
    title: 'Pizzaböden',
    subtitle: 'Vorgebacken, 12 Stunden fermentiert',
    body: [
      "Unsere Pizzaböden werden aus demselben Sauerteig wie unsere Brote hergestellt und mindestens 12 Stunden fermentiert. Vorgebacken und mit einer Tomaten-Parmesan-Basis belegt — einfach nach Belieben garnieren und 8 bis 10 Minuten in den Ofen schieben.",
      "Auf Bestellung erhältlich — bitte die gewünschte Menge im Formular angeben.",
    ],
  },
};

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export default function App() {
  const path = usePath();
  const [panettonOpen, setPanettonOpen] = useState(false);
  const [pizzaOpen, setPizzaOpen] = useState(false);

  if (path === '/mentions-legales') return <MentionsLegales />;
  if (path === '/confidentialite') return <Confidentialite />;
  if (path === '/cgv') return <CGV />;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <VacationBanner />
        <Nav />
      </div>
      <Hero />
      <Products />
      <Info />
      <OrderForm />
      <About />
      <Footer />

      <Modal
        isOpen={panettonOpen}
        onClose={() => setPanettonOpen(false)}
        content={panettoneContent}
      />
      <Modal
        isOpen={pizzaOpen}
        onClose={() => setPizzaOpen(false)}
        content={pizzaContent}
      />
    </>
  );
}
