
import React from 'react';
import { WorkItem } from '../types';
import ReactMarkdown from 'react-markdown';

interface CanvasProps {
  items: WorkItem[];
  isZenMode: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ items, isZenMode }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h1 className="serif text-4xl md:text-6xl text-zinc-300 font-light mb-4 select-none">
          Tabula Rasa
        </h1>
        <p className="text-zinc-400 font-light max-w-md animate-pulse">
          Begin your journey by typing a thought or summoning a vision below.
        </p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-6 py-20 space-y-16 transition-opacity duration-1000 ${isZenMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
      {items.map((item) => (
        <div key={item.id} className="fade-in group relative border-l border-zinc-100 pl-8 transition-colors hover:border-zinc-300">
          <span className="absolute -left-12 top-0 text-[10px] uppercase tracking-[0.2em] text-zinc-300 transform rotate-90 origin-right select-none">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {item.type === 'text' || item.type === 'idea' ? (
            <div className="prose prose-zinc prose-lg max-w-none">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-4">
              <img 
                src={item.content} 
                alt={item.metadata?.prompt} 
                className="w-full h-auto rounded-lg shadow-sm grayscale hover:grayscale-0 transition-all duration-700"
              />
              <p className="text-xs italic text-zinc-400 font-light tracking-wide">
                Visualization: {item.metadata?.prompt}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Canvas;
