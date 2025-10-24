import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { Shop, Product } from '../types';
import { CloseIcon, PaperAirplaneIcon, SparklesIcon } from './Icons';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  recommendations?: { shop: Shop; product: Product; reasoning: string }[];
}

interface PersonalShopperChatProps {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
  onSelectShop: (shopId: string) => void;
}

const PersonalShopperChat: React.FC<PersonalShopperChatProps> = ({ isOpen, onClose, shops, onSelectShop }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 'initial',
          sender: 'assistant',
          text: 'Ciao! Sono il tuo Personal Shopper. Dimmi cosa stai cercando e ti aiuterò a trovarlo nei negozi del borgo.',
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const shopsDataForPrompt = shops.map(shop => ({
        shopId: shop.id,
        shopName: shop.name,
        shopDescription: shop.description,
        products: shop.products.map(p => ({
          productId: p.id,
          productName: p.name,
          productDescription: p.description,
          price: p.price,
        })),
      }));

      const prompt = `Sei un personal shopper amichevole e disponibile per "La Rete del Borgo". Un utente sta cercando dei prodotti. Ecco un elenco di tutti i negozi e dei loro prodotti in formato JSON: ${JSON.stringify(shopsDataForPrompt)}. La richiesta dell'utente è: "${input}". 
      
Analizza la richiesta e i dati dei prodotti. Se trovi delle buone corrispondenze, rispondi con un breve messaggio introduttivo e poi raccomanda fino a 3 prodotti. 

La tua risposta DEVE essere un oggetto JSON valido. L'oggetto JSON deve avere due proprietà:
1. "responseText": una stringa con il tuo messaggio amichevole per l'utente.
2. "recommendations": un array di oggetti, dove ogni oggetto rappresenta un prodotto raccomandato e contiene "shopId", "productId" e "reasoning" (una breve frase che spiega perché hai scelto quel prodotto).

Se non trovi nessuna corrispondenza, "recommendations" deve essere un array vuoto e "responseText" deve spiegare gentilmente che non hai trovato nulla e magari chiedere più dettagli.
NON rispondere in nessun altro formato. Solo JSON.`;
      
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
              responseText: { type: Type.STRING },
              recommendations: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          shopId: { type: Type.STRING },
                          productId: { type: Type.STRING },
                          reasoning: { type: Type.STRING },
                      },
                      required: ["shopId", "productId", "reasoning"],
                  }
              }
          },
          required: ["responseText", "recommendations"],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const jsonResponse = JSON.parse(response.text);
      const { responseText, recommendations: recommendationData } = jsonResponse;

      const recommendations = recommendationData.map((rec: any) => {
        const shop = shops.find(s => s.id === rec.shopId);
        const product = shop?.products.find(p => p.id === rec.productId);
        if (shop && product) {
          return { shop, product, reasoning: rec.reasoning };
        }
        return null;
      }).filter(Boolean);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Oops! Qualcosa è andato storto. Riprova più tardi.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex items-end justify-end p-0 sm:p-6 animate-fade-in">
      <div className="bg-white w-full h-full sm:w-[440px] sm:h-auto sm:max-h-[700px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-orange-500" />
            <h2 className="font-bold text-lg text-gray-800">Personal Shopper</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
              {message.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-white"/>
                </div>
              )}
              <div className="max-w-xs md:max-w-sm">
                <div className={`p-3 rounded-2xl ${message.sender === 'user' ? 'bg-orange-500 text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>
                  {message.text && <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{message.text}</p>}
                </div>
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.recommendations.map(({ shop, product, reasoning }) => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="flex gap-3">
                          <img src={product.images[0] || shop.cardImage} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0"/>
                          <div>
                            <p className="font-bold text-sm">{product.name}</p>
                            <p className="text-orange-600 font-semibold text-sm">{product.price}</p>
                            <p className="text-xs text-gray-500 mt-1">{shop.name}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 italic mt-2 p-2 bg-gray-50 rounded-md">"{reasoning}"</p>
                        <button onClick={() => onSelectShop(shop.id)} className="mt-2 w-full text-center bg-orange-50 text-orange-600 text-xs font-bold py-1.5 rounded-full hover:bg-orange-100 transition-colors">Vedi Negozio</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-white"/>
                </div>
                <div className="p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-lg">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Es. 'Cerco un regalo per...' "
              className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed flex-shrink-0">
              <PaperAirplaneIcon className="w-5 h-5"/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalShopperChat;
