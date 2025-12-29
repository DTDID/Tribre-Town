import React from 'react';

// This component is no longer used since we removed Clerk.
// Keeping a stub in case of lingering imports.

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  return null;
};

export default LoginModal;