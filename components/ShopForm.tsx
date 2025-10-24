import React, { useState, useEffect, useRef } from 'react';
import type { Shop } from '../types';
import { CATEGORIES } from '../constants';
import { CloseIcon } from './Icons';

// --- Image Compression Utility ---
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) return reject(new Error("FileReader error."));
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleFactor = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context error.'));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
// FIX: The anonymous function `(error) => reject(error)` can sometimes cause issues with TypeScript's type inference in complex scenarios.
// Passing `reject` directly is cleaner and ensures the types are handled correctly, as the function signatures are compatible.
            img.onerror = reject;
        };
// FIX: The anonymous function `(error) => reject(error)` can sometimes cause issues with TypeScript's type inference in complex scenarios.
// Passing `reject` directly is cleaner and ensures the types are handled correctly, as the function signatures are compatible.
        reader.onerror = reject;
    });
};

const useGoogleMapsScript = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!process.env.API_KEY) {
      console.error("Google Maps API key is not defined in process.env.");
      return;
    }
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
        // Script already requested, wait for it to load
        const check = setInterval(() => {
            if (window.google && window.google.maps) {
                setIsLoaded(true);
                clearInterval(check);
            }
        }, 100);
        return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Failed to load Google Maps script.");
    document.head.appendChild(script);

  }, []);
  return isLoaded;
};

interface ShopFormProps {
    shop?: Shop | null;
    onSave: (shopData: Omit<Shop, 'ownerId'>) => void;
    onClose: () => void;
}

const ShopForm: React.FC<ShopFormProps> = ({ shop, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: shop?.id || '',
        name: shop?.name || '',
        category: shop?.category || 'Negozi',
        address: shop?.address || '',
        lat: shop?.lat || 0,
        lng: shop?.lng || 0,
        description: shop?.description || '',
        longDescription: shop?.longDescription || '',
        cardImage: shop?.cardImage || '',
        galleryImages: shop?.galleryImages || [],
    });
    
    const [cardImagePreview, setCardImagePreview] = useState<string | null>(shop?.cardImage || null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>(shop?.galleryImages || []);
    const [isProcessingImages, setIsProcessingImages] = useState(false);
    
    const autocompleteInputRef = useRef<HTMLInputElement>(null);
    const isMapsLoaded = useGoogleMapsScript();

    useEffect(() => {
        if (isMapsLoaded && autocompleteInputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
                types: ['establishment'],
                fields: ['name', 'formatted_address', 'geometry.location']
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place?.geometry?.location) {
                    setFormData(prev => ({
                        ...prev,
                        name: place.name || prev.name,
                        address: place.formatted_address || prev.address,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }));
                }
            });
        }
    }, [isMapsLoaded]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsProcessingImages(true);
            try {
                const compressed = await compressImage(e.target.files[0]);
                setFormData(prev => ({ ...prev, cardImage: compressed }));
                setCardImagePreview(compressed);
            } catch (error) { console.error("Image compression failed:", error); } 
            finally { setIsProcessingImages(false); }
        }
    };

    const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            if (e.target.files.length > 3) {
                alert('Puoi caricare al massimo 3 immagini.');
                e.target.value = '';
                return;
            }
            setIsProcessingImages(true);
            try {
                const compressed = await Promise.all(Array.from(e.target.files).map(file => compressImage(file)));
                setFormData(prev => ({ ...prev, galleryImages: compressed }));
                setGalleryPreviews(compressed);
            } catch (error) { console.error("Gallery compression failed:", error); }
            finally { setIsProcessingImages(false); }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalShopData: Omit<Shop, 'ownerId'> = {
            ...(shop || {
                id: `shop-${Date.now()}`,
                rating: 0,
                reviewCount: 0,
                isFeatured: false,
                products: [],
                reviews: [],
                coupons: [],
            }),
            ...formData,
        };
        onSave(finalShopData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold">{shop ? 'Modifica Attività' : 'Aggiungi Nuova Attività'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <input
                        ref={autocompleteInputRef}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Cerca indirizzo o nome attività..."
                        className="w-full border-gray-300 rounded-md"
                        required
                    />
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nome Attività"
                        className="w-full border-gray-300 rounded-md"
                        required
                    />
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full border-gray-300 rounded-md">
                        {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descrizione breve (per la card)"
                        rows={2}
                        className="w-full border-gray-300 rounded-md"
                        required
                    />
                    <textarea
                        name="longDescription"
                        value={formData.longDescription}
                        onChange={handleChange}
                        placeholder="Descrizione lunga (per la pagina dettaglio)"
                        rows={5}
                        className="w-full border-gray-300 rounded-md"
                        required
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Immagine Principale</label>
                        {cardImagePreview && <img src={cardImagePreview} className="w-48 h-32 object-cover rounded-md border mb-2"/>}
                        <input type="file" accept="image/*" onChange={handleCardImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" required={!shop}/>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Galleria Immagini (max 3)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {galleryPreviews.map((src, i) => <img key={i} src={src} className="w-24 h-24 object-cover rounded-md border"/>)}
                        </div>
                        <input type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Annulla</button>
                        <button type="submit" disabled={isProcessingImages} className="bg-orange-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-orange-700 disabled:bg-orange-300">
                            {isProcessingImages ? 'Elaboro...' : 'Salva Attività'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShopForm;