
import React from 'react';
import type { User } from '../types';
import { CloseIcon, UserIcon, GridIcon, MapIcon, PlusIcon } from './Icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onAddShop: () => void;
    onViewChange: (view: 'piazza' | 'mappa') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentUser, onAddShop, onViewChange }) => {
    return (
        <>
            {/* Overlay */}
            <div 
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            
            {/* Sidebar */}
            <aside 
                className={`fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="font-bold text-lg">Menu</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Profile Section */}
                    <div className="p-4 border-b border-gray-200">
                        {currentUser ? (
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm truncate">{currentUser.email}</p>
                                    <p className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full inline-block capitalize">{currentUser.type}</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600">Accedi per un'esperienza completa.</p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-grow p-4 space-y-1">
                         <button onClick={() => onViewChange('piazza')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md">
                            <GridIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Piazza</span>
                        </button>
                        <button onClick={() => onViewChange('mappa')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md">
                           <MapIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Mappa</span>
                        </button>

                         {currentUser?.type === 'esercente' && (
                             <button onClick={onAddShop} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md">
                                <PlusIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Aggiungi Attività</span>
                            </button>
                         )}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
