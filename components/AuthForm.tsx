
import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';

const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState<'cliente' | 'esercente'>('cliente');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (isLogin) {
            try {
                // FIX: Use v8 signInWithEmailAndPassword method
                await auth.signInWithEmailAndPassword(email, password);
                // No need to close, App component will handle re-render
            } catch (err: any) {
                setError('Credenziali non valide o utente non trovato.');
                console.error(err);
            }
        } else {
            if (password !== confirmPassword) {
                setError("Le password non coincidono.");
                setIsLoading(false);
                return;
            }
            try {
                // FIX: Use v8 createUserWithEmailAndPassword method
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                // Create a user document in Firestore to store the user type
                if (user) {
                    // FIX: Use v8 collection, doc, and set methods
                    await db.collection("users").doc(user.uid).set({
                        email: user.email,
                        type: userType
                    });
                }
            } catch (err: any) {
                if (err.code === 'auth/email-already-in-use') {
                    setError('Questa email è già stata registrata.');
                } else {
                    setError('Errore durante la registrazione.');
                }
                console.error(err);
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in">
                <div className="p-6 text-center border-b">
                    <h2 className="text-xl font-bold">{isLogin ? 'Accedi' : 'Registrati'}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isLogin ? 'Bentornato nella Rete del Borgo!' : 'Crea un account per iniziare.'}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>

                    {!isLogin && (
                        <>
                             <div>
                                <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700 mb-1">Conferma Password</label>
                                <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di utente</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setUserType('cliente')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold border ${userType === 'cliente' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Cliente</button>
                                    <button type="button" onClick={() => setUserType('esercente')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold border ${userType === 'esercente' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Esercente</button>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div className="pt-2">
                         <button type="submit" disabled={isLoading} className="w-full bg-orange-600 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-orange-700 disabled:bg-orange-300">
                            {isLoading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
                        </button>
                    </div>

                    <div className="text-center">
                        <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-orange-600 hover:underline">
                            {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthForm;
