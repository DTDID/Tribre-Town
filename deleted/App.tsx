
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkItem } from './types';
import * as gemini from './services/geminiService';
import Canvas from './components/Canvas';
import { 
  Sparkles, 
  Image as ImageIcon, 
  MessageSquare, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Trash2, 
  Loader2,
  Send,
  ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    const prompt = inputValue.trim();
    setInputValue('');

    try {
      if (activeTab === 'text') {
        const response = await gemini.generateThought(prompt);
        const newItem: WorkItem = {
          id: crypto.randomUUID(),
          type: 'text',
          content: response,
          timestamp: Date.now(),
        };
        setItems(prev => [newItem, ...prev]);
      } else {
        const imageUrl = await gemini.generateVisual(prompt);
        const newItem: WorkItem = {
          id: crypto.randomUUID(),
          type: 'image',
          content: imageUrl,
          timestamp: Date.now(),
          metadata: { prompt }
        };
        setItems(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error("Error manifesting content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCanvas = () => {
    if (confirm("Clear your creative space?")) {
      setItems([]);
    }
  };

  const summonInspiration = async () => {
    setIsLoading(true);
    try {
      const suggestion = await gemini.suggestPrompt();
      setInputValue(suggestion);
    } catch (error) {
      console.error("Inspiration failed:", error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${isZenMode ? 'bg-[#111] text-zinc-100' : 'bg-[#fafafa] text-zinc-900'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-20 transition-opacity duration-1000 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-zinc-900"></div>
          <span className="serif text-xl tracking-tight">Tabula Rasa</span>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            onClick={summonInspiration}
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center space-x-2"
          >
            <Sparkles size={14} />
            <span>Inspiration</span>
          </button>
          <button 
            onClick={() => setIsZenMode(!isZenMode)}
            className="text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={clearCanvas}
            className="text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-40">
        <Canvas items={items} isZenMode={isZenMode} />
      </main>

      {/* Persistent Input Controller */}
      <div className={`fixed bottom-0 left-0 right-0 p-8 z-30 transition-all duration-700 ${isZenMode ? 'opacity-0 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}>
        <div className="max-w-2xl mx-auto">
          {/* Action Selector */}
          <div className="flex justify-center mb-4 space-x-4">
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'text' ? 'bg-zinc-900 text-white' : 'bg-white/80 border border-zinc-100 text-zinc-500 hover:bg-zinc-50'}`}
            >
              <MessageSquare size={14} />
              <span>Thought</span>
            </button>
            <button 
              onClick={() => setActiveTab('image')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'image' ? 'bg-zinc-900 text-white' : 'bg-white/80 border border-zinc-100 text-zinc-500 hover:bg-zinc-50'}`}
            >
              <ImageIcon size={14} />
              <span>Vision</span>
            </button>
          </div>

          {/* Form */}
          <form 
            onSubmit={handleAction}
            className="relative group"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={activeTab === 'text' ? "Enter a seed of a thought..." : "Describe a visualization..."}
              className={`w-full px-8 py-5 rounded-2xl border-0 shadow-2xl ring-1 ring-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none transition-all duration-500 text-lg font-light ${isZenMode ? 'bg-zinc-800/80 text-white ring-zinc-700 placeholder:text-zinc-500' : 'bg-white text-zinc-900 placeholder:text-zinc-300'}`}
            />
            <button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-900 text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-lg"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <ArrowRight size={24} />
              )}
            </button>
          </form>
          
          <p className="mt-4 text-center text-[10px] text-zinc-400 uppercase tracking-widest font-light">
            Press enter to manifest
          </p>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-zinc-100 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
};

export default App;
