import React from 'react';
import { SearchIcon, GridIcon, MapIcon } from './Icons';

interface HeaderProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    view: 'piazza' | 'mappa' | 'negozio';
    onViewChange: (view: 'piazza' | 'mappa') => void;
    onMenuClick: () => void;
}

const MenuIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, view, onViewChange, onMenuClick }) => {
  const isMapView = view === 'mappa';

  return (
    <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top section */}
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                 <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-600 hover:text-orange-500 hover:bg-gray-100 rounded-full">
                    <MenuIcon className="w-6 h-6"/>
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            La Rete del Borgo
                        </h1>
                    </div>
                </div>
            </div>
            
             <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 rounded-full">
                <button 
                    onClick={() => onViewChange('piazza')} 
                    className={`${!isMapView ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:bg-gray-200'} p-2 rounded-full transition-colors`} 
                    aria-label="Grid View"
                    aria-pressed={!isMapView}
                >
                    <GridIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onViewChange('mappa')} 
                    className={`${isMapView ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:bg-gray-200'} p-2 rounded-full transition-colors`} 
                    aria-label="Map View"
                    aria-pressed={isMapView}
                >
                    <MapIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Bottom section */}
        <div className="flex items-center gap-4 py-3">
            <div className="relative flex-grow">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cerca attività, prodotti, servizi..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                />
            </div>
             <div className="flex sm:hidden items-center gap-1 p-1 bg-gray-100 rounded-full">
                <button 
                    onClick={() => onViewChange('piazza')} 
                    className={`${!isMapView ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:bg-gray-200'} p-2 rounded-full transition-colors`} 
                    aria-label="Grid View"
                    aria-pressed={!isMapView}
                >
                    <GridIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onViewChange('mappa')} 
                    className={`${isMapView ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:bg-gray-200'} p-2 rounded-full transition-colors`} 
                    aria-label="Map View"
                    aria-pressed={isMapView}
                >
                    <MapIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;