import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  onLoginClick: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Login Button Visibility State
  const [showLoginButton, setShowLoginButton] = useState(false);
  const pressCountRef = useRef(0);
  const lastPressTimeRef = useRef(0);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Triple Control Click to Toggle Login Button
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.repeat) return; // Ignore held down keys

          if (e.key === 'Control') {
              const now = Date.now();
              const diff = now - lastPressTimeRef.current;

              // 500ms threshold for "consecutive" clicks
              if (diff < 500) {
                  pressCountRef.current += 1;
              } else {
                  pressCountRef.current = 1;
              }
              lastPressTimeRef.current = now;

              if (pressCountRef.current === 3) {
                  setShowLoginButton(prev => !prev);
                  pressCountRef.current = 0; // Reset after toggle
              }
          } else {
              // Reset if another key is pressed in between
              pressCountRef.current = 0;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    if (!showLoginButton) return null;

    return (
      <button 
        onClick={onLoginClick}
        className="pointer-events-auto fixed top-5 right-5 bg-[#0f3460] hover:bg-[#16213e] border border-[#4a4a60] text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 z-50 animate-in fade-in zoom-in duration-300"
      >
        <User size={18} />
        <span>Login</span>
      </button>
    );
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    steward: 'bg-emerald-500',
    foundation: 'bg-purple-500',
    contributor: 'bg-blue-500',
    member: 'bg-gray-500'
  };

  return (
    <div ref={menuRef} className="pointer-events-auto fixed top-5 right-5 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1e1e2e] hover:bg-[#2a2a40] border border-[#444] text-white pl-3 pr-2 py-1.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-3"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm leading-none">{user.username}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">{user.roles.includes('admin') ? 'Admin' : user.roles[user.roles.length-1]}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#0f3460] flex items-center justify-center border border-white/20">
          <span className="text-xs font-bold">{user.username.slice(0, 2).toUpperCase()}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e2e] border border-[#444] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-[#333]">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">My Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map(role => (
                <span 
                  key={role} 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wide ${roleColors[role] || 'bg-gray-500'}`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div className="p-1">
            <button 
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-white/5 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;