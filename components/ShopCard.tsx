import React from 'react';
import type { Shop } from '../types';
import { StarIcon, LocationPinIcon } from './Icons';

interface ShopCardProps {
  shop: Shop;
  onSelect: (id: string) => void;
}

const categoryColorMap: { [key in Shop['category']]: string } = {
    'Ristoranti': 'bg-red-500',
    'Negozi': 'bg-blue-500',
    'Bellezza': 'bg-pink-500',
    'Benessere': 'bg-teal-500',
    'Servizi': 'bg-purple-500',
};

const ShopCard: React.FC<ShopCardProps> = ({ shop, onSelect }) => {
  return (
    <button onClick={() => onSelect(shop.id)} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col hover:shadow-2xl text-left w-full">
        <div className="relative">
            <img src={shop.cardImage} alt={shop.name} className="w-full h-48 object-cover" />
            {shop.isFeatured && (
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <StarIcon filled className="w-3.5 h-3.5" />
                    <span>In Evidenza</span>
                </div>
            )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800 leading-tight">{shop.name}</h3>
                <div className="flex-shrink-0 flex items-center gap-1 text-sm font-bold text-gray-700 ml-2">
                    <StarIcon filled className="w-5 h-5 text-orange-400" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal text-xs">({shop.reviewCount})</span>
                </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${categoryColorMap[shop.category]}`}></span>
                {shop.category}
            </p>
            
            <p className="text-sm text-gray-600 mb-4 flex-grow">{shop.description}</p>
            
            <div className="border-t border-gray-100 pt-4 mt-auto">
                 <p className="text-xs text-gray-500 flex items-center gap-2">
                    <LocationPinIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{shop.address}</span>
                </p>
            </div>
        </div>
    </button>
  );
};

export default ShopCard;