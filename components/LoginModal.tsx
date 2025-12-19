import React, { useEffect } from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { isSignedIn } = useUser();

  // Auto-close if user successfully logs in
  useEffect(() => {
    if (isSignedIn) {
      onClose();
    }
  }, [isSignedIn, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="relative animate-in fade-in zoom-in duration-200">
        <button 
            onClick={onClose} 
            className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
            <span className="text-sm font-bold uppercase tracking-wider">Close</span>
            <X size={24} />
        </button>
        
        {/* Clerk Sign In Component - Dark Mode via CSS in index.html */}
        <SignIn />
      </div>
    </div>
  );
};

export default LoginModal;