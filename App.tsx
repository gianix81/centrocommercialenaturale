
import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebaseConfig';

import type { Shop, Category, Product, Review, Coupon, User } from './types';
import { CATEGORIES } from './constants';
import Header from './components/Header';
import Piazza from './components/Piazza';
import ShopDetailPage from './components/ShopDetail';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ShopForm from './components/ShopForm';
import PersonalShopperChat from './components/PersonalShopperChat';
import { SparklesIcon } from './components/Icons';

declare global {
  interface Window {
    google: any;
  }
}

type View = 'piazza' | 'mappa' | 'negozio';

// Mock user for development without authentication
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'esercente@example.com',
  type: 'esercente',
};

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USER);
  const [isLoading, setIsLoading] = useState(false); // Auth is disabled, so not loading

  const [activeCategory, setActiveCategory] = useState<Category | 'Tutte'>('Tutte');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<View>('piazza');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // --- EFFECTS ---

  // Firestore Shops Listener
  useEffect(() => {
    // FIX: Use v8 collection method
    const shopsCollectionRef = db.collection('shops');
    // FIX: Use v8 onSnapshot method
    const unsubscribe = shopsCollectionRef.onSnapshot((snapshot) => {
      const shopsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Shop));
      setShops(shopsData);
    });
    return () => unsubscribe();
  }, []);


  // --- COMPUTED VALUES ---
  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesCategory = activeCategory === 'Tutte' || shop.category === activeCategory;
      const matchesSearch = searchTerm === '' ||
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, shops]);

  const selectedShop = useMemo(() => {
    return shops.find(shop => shop.id === selectedShopId) || null;
  }, [selectedShopId, shops]);
  
  // --- HANDLERS (Now operating on Firestore) ---
  
  const handleSelectShop = (id: string) => {
    setSelectedShopId(id);
    setView('negozio');
  };

  const handleSelectShopFromChat = (id: string) => {
    handleSelectShop(id);
    setIsChatOpen(false);
  }

  const handleGoBack = () => {
    setSelectedShopId(null);
    setView('piazza');
  }

  const handleAddShopClick = () => {
    if (!currentUser || currentUser.type !== 'esercente') {
        alert("Devi essere un esercente per aggiungere un'attività.");
        return;
    }
    setEditingShop(null);
    setIsFormOpen(true);
    setIsSidebarOpen(false);
  };

  const handleEditShopClick = (shop: Shop) => {
    setEditingShop(shop);
    setIsFormOpen(true);
  };

  const handleDeleteShop = async (id: string) => {
    // FIX: Use v8 collection and doc methods
    const shopDocRef = db.collection('shops').doc(id);
    // FIX: Use v8 delete method
    await shopDocRef.delete();
    if (selectedShopId === id) {
        handleGoBack();
    }
  };

  const handleFormSave = async (shopData: Omit<Shop, 'ownerId'>) => {
    if (!currentUser) return;
    const finalShopData = { ...shopData, ownerId: currentUser.email };
    
    if (editingShop) {
        // FIX: Use v8 collection and doc methods
        const shopDocRef = db.collection('shops').doc(finalShopData.id);
        // FIX: Use v8 update method
        await shopDocRef.update(finalShopData as { [x: string]: any });
    } else {
        // FIX: Use v8 collection and add methods
        await db.collection('shops').add(finalShopData);
    }
    setIsFormOpen(false);
    setEditingShop(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingShop(null);
  };

  const handleSaveProduct = async (shopId: string, productData: Product) => {
    // FIX: Use v8 collection and doc methods
    const shopDocRef = db.collection('shops').doc(shopId);
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    
    const existingProductIndex = shop.products.findIndex(p => p.id === productData.id);
    let newProducts;

    if (existingProductIndex > -1) {
        newProducts = shop.products.map((p, index) => index === existingProductIndex ? productData : p);
    } else {
        newProducts = [...shop.products, productData];
    }
    
    // FIX: Use v8 update method
    await shopDocRef.update({ products: newProducts });
  };

  const handleDeleteProduct = async (shopId: string, productId: string) => {
    // FIX: Use v8 collection and doc methods
    const shopDocRef = db.collection('shops').doc(shopId);
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    
    const newProducts = shop.products.filter(p => p.id !== productId);
    // FIX: Use v8 update method
    await shopDocRef.update({ products: newProducts });
  };

  const handleSaveCoupon = async (shopId: string, couponData: Coupon) => {
    // FIX: Use v8 collection and doc methods
    const shopDocRef = db.collection('shops').doc(shopId);
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;

    const existingCouponIndex = shop.coupons.findIndex(c => c.id === couponData.id);
    let newCoupons;

    if (existingCouponIndex > -1) {
        newCoupons = shop.coupons.map((c, index) => index === existingCouponIndex ? couponData : c);
    } else {
        newCoupons = [...shop.coupons, couponData];
    }
    // FIX: Use v8 update method
    await shopDocRef.update({ coupons: newCoupons });
  };

  const handleDeleteCoupon = async (shopId: string, couponId: string) => {
      // FIX: Use v8 collection and doc methods
      const shopDocRef = db.collection('shops').doc(shopId);
      const shop = shops.find(s => s.id === shopId);
      if (!shop) return;

      const newCoupons = shop.coupons.filter(c => c.id !== couponId);
      // FIX: Use v8 update method
      await shopDocRef.update({ coupons: newCoupons });
  };
  
  const handleSaveReview = async (shopId: string, reviewData: Review) => {
    // FIX: Use v8 collection and doc methods
    const shopDocRef = db.collection('shops').doc(shopId);
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    
    // FIX: Use v8 batch method
    const batch = db.batch();

    const newReviews = [reviewData, ...shop.reviews];
    const totalRating = newReviews.reduce((sum, review) => sum + review.rating, 0);
    const newAverageRating = newReviews.length > 0 ? totalRating / newReviews.length : 0;
    
    batch.update(shopDocRef, {
        reviews: newReviews,
        rating: newAverageRating,
        reviewCount: newReviews.length
    });

    await batch.commit();
  };
  
  // --- RENDER LOGIC ---
  if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>
  }

  const renderContent = () => {
    if (view === 'negozio' && selectedShop) {
      return <ShopDetailPage 
                shop={selectedShop} 
                currentUser={currentUser}
                onGoBack={handleGoBack} 
                onEdit={handleEditShopClick} 
                onDelete={handleDeleteShop}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onSaveCoupon={handleSaveCoupon}
                onDeleteCoupon={handleDeleteCoupon}
                onSaveReview={handleSaveReview}
            />;
    }
    if (view === 'mappa') {
        return <MapView shops={filteredShops} onSelectShop={handleSelectShop} />;
    }
    return (
        <Piazza 
            shops={filteredShops}
            allShopsEmpty={shops.length === 0}
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectShop={handleSelectShop}
            currentUser={currentUser}
        />
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans flex flex-col">
        {/* Authentication is disabled */}

        <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            currentUser={currentUser}
            onAddShop={handleAddShopClick}
            onViewChange={(v) => { setView(v); handleGoBack(); setIsSidebarOpen(false); }}
        />
      
        <Header 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm}
            view={view}
            onViewChange={(v) => { setView(v); handleGoBack(); }}
            onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-grow container mx-auto px-4 md:px-6 py-6">
            {renderContent()}
        </main>
        <Footer />
        {isFormOpen && <ShopForm shop={editingShop} onSave={handleFormSave} onClose={handleFormClose} />}
        
        {currentUser && (
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-110 z-20 animate-fade-in"
                aria-label="Apri Personal Shopper"
            >
                <SparklesIcon className="w-6 h-6" />
            </button>
        )}

        <PersonalShopperChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            shops={shops}
            onSelectShop={handleSelectShopFromChat}
        />
    </div>
  );
};

export default App;
