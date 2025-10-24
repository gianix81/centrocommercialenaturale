import React, {useState, useMemo} from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Shop, Product, Coupon, Review, User } from '../types';
import { 
    BackIcon, ArrowLeftIcon, ArrowRightIcon, StarIcon, EditIcon, DeleteIcon, 
    SparklesIcon, PlusIcon, CloseIcon, TagIcon
} from './Icons';


// --- Image Compression Utility ---
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("FileReader did not return a result."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleFactor = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
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


// --- Gemini Component ---
const GeminiSocialPost: React.FC<{shop: Shop}> = ({shop}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [post, setPost] = useState('');
    const [error, setError] = useState('');

    const handleGeneratePost = async () => {
        setIsLoading(true);
        setError('');
        setPost('');
        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Crea un post social coinvolgente e amichevole in italiano per questo negozio: Nome: "${shop.name}", che si occupa di: "${shop.description}". Il post deve suonare come un annuncio dal proprietario del negozio alla sua comunità locale, invitandoli a passare. Sii creativo, caloroso e usa qualche emoji.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            setPost(response.text);
        } catch (e) {
            console.error(e);
            setError("Oops! Qualcosa è andato storto durante la generazione del post.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif text-gray-800">Le Ultime dal Borgo</h3>
                 <button 
                    onClick={handleGeneratePost}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all duration-300 disabled:bg-orange-300 disabled:cursor-not-allowed transform hover:scale-105"
                 >
                    <SparklesIcon className="w-5 h-5"/>
                    <span>{isLoading ? "Creo..." : "Genera un post"}</span>
                 </button>
            </div>
            {isLoading && <div className="text-center py-8 text-gray-500">Sto pensando a qualcosa di speciale...</div>}
            {error && <div className="text-center py-8 text-red-500">{error}</div>}
            {post && (
                <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{post}</p>
                </div>
            )}
            {!isLoading && !post && <p className="mt-2 text-sm text-gray-500">Clicca il pulsante per creare un post social per questa attività usando l'IA!</p>}
        </div>
    )
}

// --- Product Showcase Components ---

interface ProductFormProps {
  product: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        price: product?.price || '',
        description: product?.description || '',
    });
    const [images, setImages] = useState<string[]>(product?.images || []);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            if (e.target.files.length > 4) {
                alert('Puoi caricare al massimo 4 immagini.');
                return;
            }
            setIsProcessing(true);
            try {
                const compressed = await Promise.all(
                    Array.from(e.target.files).map(file => compressImage(file, 600))
                );
                setImages(compressed);
            } catch (error) {
                console.error("Image compression failed", error);
                alert("Errore durante la compressione delle immagini.");
            } finally {
                setIsProcessing(false);
            }
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: product?.id || `prod-${Date.now()}`,
            ...formData,
            images,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                 <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">{product ? 'Modifica Prodotto' : 'Aggiungi Prodotto'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Form fields */}
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome Prodotto" className="w-full border-gray-300 rounded-md" required/>
                    <input name="price" value={formData.price} onChange={handleChange} placeholder="Prezzo (es. 19,99€)" className="w-full border-gray-300 rounded-md" required/>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrizione prodotto" rows={3} className="w-full border-gray-300 rounded-md" required/>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Immagini (max 4)</label>
                         <div className="flex flex-wrap gap-2 mb-2">
                            {images.map((src, i) => <img key={i} src={src} className="w-24 h-24 object-cover rounded-md border"/>)}
                         </div>
                         <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Annulla</button>
                        <button type="submit" disabled={isProcessing} className="bg-orange-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-orange-700 disabled:bg-orange-300">
                           {isProcessing ? 'Elaboro...' : 'Salva Prodotto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ProductCardProps {
  product: Product;
  isOwner: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}
const ProductCard: React.FC<ProductCardProps> = ({ product, isOwner, onEdit, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const hasMultipleImages = product.images.length > 1;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % product.images.length);
    };
    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col">
            <div className="relative h-48 w-full">
                <img src={product.images[currentIndex] || 'https://placehold.co/400x300?text=Nessuna+Immagine'} alt={product.name} className="w-full h-full object-cover" />
                {hasMultipleImages && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full hover:bg-black/60"><ArrowLeftIcon className="w-5 h-5"/></button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full hover:bg-black/60"><ArrowRightIcon className="w-5 h-5"/></button>
                    </>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h4 className="font-bold text-md text-gray-800">{product.name}</h4>
                <p className="text-lg font-semibold text-orange-600 my-1">{product.price}</p>
                <p className="text-sm text-gray-600 flex-grow">{product.description}</p>
                 {isOwner && (
                    <div className="flex items-center gap-2 mt-4 border-t pt-3">
                        <button onClick={() => onEdit(product)} className="text-sm text-blue-600 hover:underline">Modifica</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => onDelete(product.id)} className="text-sm text-red-600 hover:underline">Elimina</button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Coupon Components ---
interface CouponFormProps {
    coupon: Coupon | null;
    onSave: (coupon: Coupon) => void;
    onClose: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({ coupon, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        description: coupon?.description || '',
        code: coupon?.code || '',
        type: coupon?.type || 'percentage',
        value: coupon?.value || 0,
        minValue: coupon?.minValue || 0,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const generateCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData(prev => ({...prev, code}));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: coupon?.id || `coupon-${Date.now()}`, ...formData });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                 <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">{coupon ? 'Modifica Buono' : 'Nuovo Buono Sconto'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <input name="description" value={formData.description} onChange={handleChange} placeholder="Descrizione (es. Sconto 20% su tutto)" className="w-full border-gray-300 rounded-md" required/>
                    <div className="flex gap-2">
                        <input name="code" value={formData.code} onChange={handleChange} placeholder="Codice Sconto" className="w-full border-gray-300 rounded-md" required/>
                        <button type="button" onClick={generateCode} className="text-sm bg-gray-100 px-3 rounded-md hover:bg-gray-200">Genera</button>
                    </div>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full border-gray-300 rounded-md">
                        <option value="percentage">Sconto Percentuale (%)</option>
                        <option value="fixed">Importo Fisso (€)</option>
                        <option value="conditional">Importo Fisso con minimo di spesa (€)</option>
                    </select>
                    <input name="value" value={formData.value} onChange={handleChange} type="number" step="0.01" placeholder="Valore sconto" className="w-full border-gray-300 rounded-md" required/>
                    {formData.type === 'conditional' && (
                         <input name="minValue" value={formData.minValue} onChange={handleChange} type="number" step="0.01" placeholder="Minimo di spesa (€)" className="w-full border-gray-300 rounded-md" required/>
                    )}
                     <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Annulla</button>
                        <button type="submit" className="bg-orange-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-orange-700">Salva Buono</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CouponCardProps {
    coupon: Coupon;
    isOwner: boolean;
    onEdit: (coupon: Coupon) => void;
    onDelete: (id: string) => void;
}
const CouponCard: React.FC<CouponCardProps> = ({ coupon, isOwner, onEdit, onDelete }) => {
    const getDiscountText = () => {
        if (coupon.type === 'percentage') return `${coupon.value}%`;
        return `${coupon.value.toFixed(2)}€`;
    };
    return (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg flex justify-between items-start">
            <div>
                 <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-orange-600">{getDiscountText()}</span>
                    <span className="text-sm font-semibold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full flex items-center gap-1"><TagIcon className="w-3 h-3"/> {coupon.code}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{coupon.description}</p>
                {coupon.type === 'conditional' && <p className="text-xs text-gray-500 mt-1">Su una spesa minima di {coupon.minValue?.toFixed(2)}€</p>}
            </div>
            {isOwner && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button onClick={() => onEdit(coupon)}><EditIcon className="w-5 h-5 text-gray-500 hover:text-blue-600"/></button>
                    <button onClick={() => onDelete(coupon.id)}><DeleteIcon className="w-5 h-5 text-gray-500 hover:text-red-600"/></button>
                </div>
            )}
        </div>
    )
};


// --- Review Components ---
interface ReviewFormProps {
    onSave: (review: Omit<Review, 'id' | 'authorImage'>) => void;
    onClose: () => void;
    currentUser: User;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSave, onClose, currentUser }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Per favore, seleziona una valutazione a stelle.");
            return;
        }
        onSave({ author: currentUser.email, rating, comment });
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                 <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">Lascia una recensione</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">La tua valutazione</p>
                        <div className="flex items-center">
                            {[1,2,3,4,5].map(star => (
                                <button key={star} type="button" onClick={() => setRating(star)} className="text-gray-300">
                                    <StarIcon filled={star <= rating} className={`w-8 h-8 ${star <= rating ? 'text-orange-400' : 'text-gray-300'}`}/>
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Scrivi qui il tuo commento..." rows={4} className="w-full border-gray-300 rounded-md" required/>
                     <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Annulla</button>
                        <button type="submit" className="bg-orange-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-orange-700">Invia Recensione</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const ReviewCard: React.FC<{review: Review}> = ({ review }) => {
    const getInitials = (name: string) => {
        return name.split('@')[0].substring(0,2).toUpperCase();
    }
    return (
        <div className="flex items-start gap-4 py-4 border-b last:border-b-0">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 flex-shrink-0">
                {getInitials(review.author)}
            </div>
            <div>
                <p className="font-semibold text-sm">{review.author}</p>
                <div className="flex items-center my-1">
                    {[1,2,3,4,5].map(star => (
                        <StarIcon key={star} filled={star <= review.rating} className="w-4 h-4 text-orange-400"/>
                    ))}
                </div>
                <p className="text-gray-600 text-sm">{review.comment}</p>
            </div>
        </div>
    )
}


// --- Shop Detail Page Component ---
interface ShopDetailPageProps {
    shop: Shop;
    currentUser: User | null;
    onGoBack: () => void;
    onEdit: (shop: Shop) => void;
    onDelete: (id: string) => void;
    onSaveProduct: (shopId: string, product: Product) => void;
    onDeleteProduct: (shopId: string, productId: string) => void;
    onSaveCoupon: (shopId: string, coupon: Coupon) => void;
    onDeleteCoupon: (shopId: string, couponId: string) => void;
    onSaveReview: (shopId: string, review: Review) => void;
}

const ShopDetailPage: React.FC<ShopDetailPageProps> = ({ 
    shop, currentUser, onGoBack, onEdit, onDelete, 
    onSaveProduct, onDeleteProduct, onSaveCoupon, onDeleteCoupon, onSaveReview 
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const isOwner = currentUser?.type === 'esercente' && currentUser.email === shop.ownerId;
    const canReview = currentUser && currentUser.email !== shop.ownerId;

    const gallery = useMemo(() => [shop.cardImage, ...shop.galleryImages].filter(img => img && img.trim() !== ''), [shop.cardImage, shop.galleryImages]);

    const goToPrevious = () => setCurrentImageIndex(prev => (prev - 1 + gallery.length) % gallery.length);
    const goToNext = () => setCurrentImageIndex(prev => (prev + 1) % gallery.length);

    const handleDelete = () => {
        if(window.confirm(`Sei sicuro di voler eliminare "${shop.name}"? L'azione è irreversibile.`)) {
            onDelete(shop.id);
        }
    };
    
    // --- Product Handlers ---
    const handleAddProduct = () => {
        if (shop.products.length >= 20) {
            alert("Hai raggiunto il limite di 20 prodotti.");
            return;
        }
        setEditingProduct(null);
        setIsProductFormOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsProductFormOpen(true);
    };
    const handleDeleteProduct = (productId: string) => {
        if(window.confirm("Sei sicuro di voler eliminare questo prodotto?")) {
            onDeleteProduct(shop.id, productId);
        }
    };

    // --- Coupon Handlers ---
    const handleEditCoupon = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setIsCouponFormOpen(true);
    }
    const handleDeleteCoupon = (couponId: string) => {
         if(window.confirm("Sei sicuro di voler eliminare questo buono?")) {
            onDeleteCoupon(shop.id, couponId);
        }
    }

    // --- Review Handler ---
    const handleSaveReviewInternal = (reviewData: Omit<Review, 'id' | 'authorImage'>) => {
        onSaveReview(shop.id, { ...reviewData, id: `rev-${Date.now()}`, authorImage: '' });
    };

    const SectionTitle: React.FC<{children: React.ReactNode}> = ({children}) => (
        <h3 className="text-2xl font-serif text-gray-700 mb-6">{children}</h3>
    );

    return (
        <div className="animate-fade-in">
            <button onClick={onGoBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-500 mb-6 transition-colors">
                <BackIcon className="w-5 h-5" />
                <span>Torna alla piazza</span>
            </button>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                 <div className="relative group h-64 md:h-80 w-full bg-gray-100">
                    {gallery.length > 0 ? (
                        <>
                            <img src={gallery[currentImageIndex]} alt={`${shop.name} gallery image ${currentImageIndex + 1}`} className="w-full h-full object-cover" />
                            {gallery.length > 1 && (
                                <>
                                 <button onClick={goToPrevious} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeftIcon className="w-6 h-6"/></button>
                                 <button onClick={goToNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRightIcon className="w-6 h-6"/></button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Nessuna immagine</div>
                    )}
                </div>


                <div className="p-6 md:p-8">
                    <h2 className="text-4xl font-bold font-serif text-gray-800">{shop.name}</h2>
                    <p className="text-gray-500 mt-1">{shop.category}</p>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <button className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition-colors">Segui</button>
                            {isOwner && (
                                <>
                                 <button onClick={() => onEdit(shop)} className="flex items-center gap-2 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-full hover:bg-gray-200 transition-colors">
                                    <EditIcon className="w-4 h-4"/> Modifica
                                </button>
                                 <button onClick={handleDelete} className="flex items-center gap-2 bg-red-50 text-red-600 font-semibold py-2 px-4 rounded-full hover:bg-red-100 transition-colors">
                                    <DeleteIcon className="w-4 h-4"/> Elimina
                                </button>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                             <StarIcon filled className="w-5 h-5 text-orange-400" />
                            <span className="font-bold">{shop.rating.toFixed(1)}</span>
                            <span>({shop.reviewCount} recensioni)</span>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            <button onClick={() => setActiveTab('info')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Informazioni</button>
                            <button onClick={() => setActiveTab('vetrina')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vetrina' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Vetrina</button>
                            <button onClick={() => setActiveTab('promozioni')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'promozioni' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Promozioni</button>
                            <button onClick={() => setActiveTab('recensioni')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recensioni' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Recensioni</button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'info' && (
                            <div className="animate-fade-in">
                                <SectionTitle>Chi Siamo</SectionTitle>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{shop.longDescription}</p>
                                {isOwner && <GeminiSocialPost shop={shop} />}
                            </div>
                        )}
                        {activeTab === 'vetrina' && (
                             <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-serif text-gray-700">Vetrina Prodotti <span className="text-base font-sans text-gray-500">({shop.products.length}/20)</span></h3>
                                    {isOwner && (
                                    <button onClick={handleAddProduct} className="flex items-center gap-2 bg-orange-50 text-orange-600 font-semibold py-2 px-4 rounded-full hover:bg-orange-100 transition-colors text-sm">
                                        <PlusIcon className="w-4 h-4"/> Aggiungi Prodotto
                                    </button>
                                    )}
                                </div>
                                {shop.products.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {shop.products.map(p => <ProductCard key={p.id} product={p} isOwner={isOwner} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />)}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">La vetrina è ancora vuota. {isOwner ? "Aggiungi il tuo primo prodotto!" : ""}</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'promozioni' && (
                           <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-serif text-gray-700">Buoni Sconto</h3>
                                    {isOwner && (
                                    <button onClick={() => { setEditingCoupon(null); setIsCouponFormOpen(true); }} className="flex items-center gap-2 bg-orange-50 text-orange-600 font-semibold py-2 px-4 rounded-full hover:bg-orange-100 transition-colors text-sm">
                                        <PlusIcon className="w-4 h-4"/> Aggiungi Buono
                                    </button>
                                    )}
                                </div>
                                {shop.coupons.length > 0 ? (
                                    <div className="space-y-4">
                                        {shop.coupons.map(c => <CouponCard key={c.id} coupon={c} isOwner={isOwner} onEdit={handleEditCoupon} onDelete={handleDeleteCoupon} />)}
                                    </div>
                                ) : (
                                     <p className="text-gray-500 text-center py-8">Nessun buono sconto attivo al momento. {isOwner ? "Crea la tua prima promozione!" : ""}</p>
                                )}
                           </div>
                        )}
                        {activeTab === 'recensioni' && (
                             <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-serif text-gray-700">Cosa dicono di noi</h3>
                                    {canReview && (
                                    <button onClick={() => setIsReviewFormOpen(true)} className="flex items-center gap-2 bg-orange-50 text-orange-600 font-semibold py-2 px-4 rounded-full hover:bg-orange-100 transition-colors text-sm">
                                        <PlusIcon className="w-4 h-4"/> Lascia una recensione
                                    </button>
                                    )}
                                </div>
                                {shop.reviews.length > 0 ? (
                                    <div>
                                        {shop.reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Nessuna recensione ancora. Sii il primo a condividere la tua esperienza!</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isProductFormOpen && isOwner && (
               <ProductForm 
                    product={editingProduct}
                    onSave={(product) => onSaveProduct(shop.id, product)}
                    onClose={() => setIsProductFormOpen(false)}
                />
            )}
             {isCouponFormOpen && isOwner && (
                <CouponForm 
                    coupon={editingCoupon}
                    onSave={(coupon) => onSaveCoupon(shop.id, coupon)}
                    onClose={() => setIsCouponFormOpen(false)}
                />
            )}
            {isReviewFormOpen && currentUser && canReview && (
                 <ReviewForm 
                    onSave={handleSaveReviewInternal}
                    onClose={() => setIsReviewFormOpen(false)}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default ShopDetailPage;