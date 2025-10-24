import React, { useState, useEffect } from 'react';
import type { Shop, Category, User } from '../types';
import ShopCard from './ShopCard';
import { LocationPinIcon, CloseIcon, RestaurantIcon, ShopIcon, BeautyIcon, WellnessIcon, ServicesIcon } from './Icons';

// --- Local Components defined within this file ---

const GeolocationBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        const dismissed = localStorage.getItem('geolocationBannerDismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('geolocationBannerDismissed', 'true');
        setIsVisible(false);
    };

    const handleActivate = () => {
        navigator.geolocation.getCurrentPosition(
            () => { handleDismiss(); },
            () => { /* Handle error silently or with a toast */ }
        );
    };

    if (!isVisible) return null;

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-4 mb-6 relative">
            <div className="flex-shrink-0 text-orange-500 pt-1">
                <LocationPinIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-semibold text-orange-800">Attiva la geolocalizzazione</h3>
                <p className="text-sm text-orange-700 mt-1">Permetti l'accesso alla tua posizione per vedere le attività più vicine e ottenere indicazioni stradali precise.</p>
                <div className="mt-4 flex items-center gap-3">
                    <button onClick={handleActivate} className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors">
                        Attiva Posizione
                    </button>
                    <button onClick={handleDismiss} className="bg-transparent text-orange-600 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-orange-100 transition-colors">
                        Non ora
                    </button>
                </div>
            </div>
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-orange-500 hover:text-orange-700" aria-label="Chiudi banner">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


interface CategoryFiltersProps {
    categories: { name: Category, icon: string }[];
    activeCategory: Category | 'Tutte';
    onSelectCategory: (category: Category | 'Tutte') => void;
}
const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
    Restaurant: RestaurantIcon,
    Shop: ShopIcon,
    Beauty: BeautyIcon,
    Wellness: WellnessIcon,
    Services: ServicesIcon,
};
const CategoryFilters: React.FC<CategoryFiltersProps> = ({ categories, activeCategory, onSelectCategory }) => {
    const renderIcon = (iconName: string, className: string) => {
        const IconComponent = iconMap[iconName];
        return IconComponent ? <IconComponent className={className} /> : null;
    }
    const baseButtonClass = "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border";
    const activeButtonClass = "bg-orange-500 text-white border-transparent shadow-sm";
    const inactiveButtonClass = "bg-white text-gray-600 border-gray-200 hover:bg-gray-100";
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                <button onClick={() => onSelectCategory('Tutte')} className={`${baseButtonClass} ${activeCategory === 'Tutte' ? activeButtonClass : inactiveButtonClass}`}>
                    Tutte
                </button>
                {categories.map(({name, icon}) => (
                    <button key={name} onClick={() => onSelectCategory(name)} className={`${baseButtonClass} ${activeCategory === name ? activeButtonClass : inactiveButtonClass}`}>
                        {renderIcon(icon, 'w-4 h-4')}
                        <span>{name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

interface ShopListProps { 
    shops: Shop[];
    allShopsEmpty: boolean;
    onSelectShop: (id: string) => void;
    currentUser: User | null;
}
const ShopList: React.FC<ShopListProps> = ({ shops, allShopsEmpty, onSelectShop, currentUser }) => {
    if (allShopsEmpty) {
         return (
            <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed">
                <div className="inline-block bg-orange-100 p-4 rounded-full">
                    <svg className="w-10 h-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0 0 11.25 11.25H4.5A2.25 2.25 0 0 0 2.25 13.5V21M3 3h12M3 3v2.25M3 3l3.75 3.75M21 3h-12m12 0v2.25m12 0l-3.75 3.75M3 10.5h18" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mt-4">La piazza è ancora vuota</h3>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    {currentUser?.type === 'esercente' 
                        ? 'Sembra che non ci siano ancora attività. Sii il primo a dare vita al borgo! Apri il menu e clicca su "Aggiungi Attività".'
                        : 'Accedi come "Esercente" per iniziare ad aggiungere le prime attività e dare vita al borgo!'}
                </p>
            </div>
        );
    }
    if (shops.length === 0) {
        return (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold text-gray-700">Nessun risultato trovato</h3>
                <p className="text-gray-500 mt-2">Prova a modificare la ricerca o i filtri.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shops.map((shop) => ( <ShopCard key={shop.id} shop={shop} onSelect={onSelectShop} /> ))}
        </div>
    );
};


// --- Main Exported Component ---

interface PiazzaProps {
  shops: Shop[];
  allShopsEmpty: boolean;
  categories: { name: Category, icon: string }[];
  activeCategory: Category | 'Tutte';
  onSelectCategory: (category: Category | 'Tutte') => void;
  onSelectShop: (id: string) => void;
  currentUser: User | null;
}

const Piazza: React.FC<PiazzaProps> = ({ shops, allShopsEmpty, categories, activeCategory, onSelectCategory, onSelectShop, currentUser }) => {
  return (
    <>
      <GeolocationBanner />
      {!allShopsEmpty && <CategoryFilters
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />}
      <ShopList shops={shops} allShopsEmpty={allShopsEmpty} onSelectShop={onSelectShop} currentUser={currentUser}/>
    </>
  );
};

export default Piazza;