import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkAuthProvider, DemoAuthProvider } from './contexts/AuthContext';
import { ClerkProvider } from '@clerk/clerk-react';
import { CLERK_PUBLISHABLE_KEY } from './constants';
import { FEATURES } from './features';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// --- ERROR SUPPRESSION ---
// Filter out the noisy Clerk initialization errors from the console
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
    const err = args[0];
    if (
        (typeof err === 'string' && (err.includes('Clerk') || err.includes('clerk'))) ||
        (err instanceof Error && (err.message.includes('Clerk') || err.message.includes('clerk')))
    ) {
        return; // Suppress
    }
    originalConsoleError(...args);
};

interface ClerkErrorBoundaryProps {
  children?: ReactNode;
}

interface ClerkErrorBoundaryState {
  hasError: boolean;
}

// --- ERROR BOUNDARY COMPONENT ---
// Used only when Clerk is active to catch initialization failures
// Fix: Use React.Component to resolve inheritance issues where setState and props were not correctly identified on the type
class ClerkErrorBoundary extends React.Component<ClerkErrorBoundaryProps, ClerkErrorBoundaryState> {
  state: ClerkErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ClerkErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Already handled by getDerivedStateFromError
  }

  componentDidMount() {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      window.addEventListener('error', this.handleError);
  }

  componentWillUnmount() {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
      window.removeEventListener('error', this.handleError);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      
      if (
          msg.includes('Clerk') || 
          msg.includes('clerk') ||
          msg.includes('Failed to fetch') ||
          msg.includes('Load failed')
      ) {
          event.preventDefault(); 
          // Fix: Ensure setState is accessed as a valid member of React.Component
          this.setState({ hasError: true });
      }
  }

  handleError = (event: ErrorEvent) => {
       const msg = event.message || "";
       if (msg.includes('Clerk') || msg.includes('clerk')) {
           event.preventDefault();
           // Fix: Ensure setState is accessed as a valid member of React.Component
           this.setState({ hasError: true });
       }
  }

  render() {
    if (this.state.hasError) {
      // FALLBACK: Render App in Demo Mode if Clerk fails
      return (
        <DemoAuthProvider>
            <App />
        </DemoAuthProvider>
      );
    }

    // Fix: Ensure props.children is accessed as a valid member of React.Component
    return this.props.children;
  }
}

// --- INITIALIZATION LOGIC ---

// 1. Check Feature Flag
if (!FEATURES.ENABLE_CLERK_AUTH) {
    console.log("Clerk Auth Disabled via Feature Flag. Starting in Demo Mode.");
    root.render(
        <React.StrictMode>
             <DemoAuthProvider>
                <App />
            </DemoAuthProvider>
        </React.StrictMode>
    );
} 
// 2. Check API Key validity
else {
    const isKeyInvalid = !CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY.includes("REPLACE_THIS");

    if (isKeyInvalid) {
        console.warn("Clerk Enabled but Key missing. Starting in Demo Mode.");
        root.render(
            <React.StrictMode>
                <DemoAuthProvider>
                    <App />
                </DemoAuthProvider>
            </React.StrictMode>
        );
    } else {
        // 3. Render Clerk Provider
        root.render(
        <React.StrictMode>
            <ClerkErrorBoundary>
                <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
                    <ClerkAuthProvider>
                        <App />
                    </ClerkAuthProvider>
                </ClerkProvider>
            </ClerkErrorBoundary>
        </React.StrictMode>
        );
    }
}