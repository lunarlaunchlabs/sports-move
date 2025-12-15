'use client';

import { useState, useEffect, useRef } from 'react';
import { SignIn, useUser } from '@clerk/nextjs';
import { FaWallet, FaEnvelope, FaTimes } from 'react-icons/fa';
import { dark } from '@clerk/themes';

interface WalletConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectExternal: () => void;
  onInvisibleWalletConnected: () => void;
}

export function WalletConnectionDialog({
  isOpen,
  onClose,
  onConnectExternal,
  onInvisibleWalletConnected,
}: WalletConnectionDialogProps) {
  const [showClerkSignIn, setShowClerkSignIn] = useState(false);
  const { isSignedIn } = useUser();
  const hasTriggeredConnection = useRef(false);

  // Handle Clerk sign-in completion in useEffect (not during render)
  useEffect(() => {
    if (isSignedIn && showClerkSignIn && !hasTriggeredConnection.current) {
      hasTriggeredConnection.current = true;
      setShowClerkSignIn(false);
      onInvisibleWalletConnected();
    }
  }, [isSignedIn, showClerkSignIn, onInvisibleWalletConnected]);

  // Reset the ref when dialog closes
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredConnection.current = false;
      setShowClerkSignIn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExternalWallet = () => {
    onConnectExternal();
  };

  const handleEmailSignIn = () => {
    setShowClerkSignIn(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showClerkSignIn ? (
            <div className="flex flex-col items-center">
              <SignIn 
                routing="hash"
                appearance={{
                  theme: dark,
                  elements: {
                    rootBox: 'w-full',
                    card: 'bg-transparent shadow-none',
                    headerTitle: 'text-white',
                    headerSubtitle: 'text-zinc-400',
                    socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
                    formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
                    formButtonPrimary: 'bg-[#F5B400] hover:bg-[#d9a000] text-black',
                    footerActionLink: 'text-[#F5B400] hover:text-[#d9a000]',
                  }
                }}
              />
              <button
                onClick={() => setShowClerkSignIn(false)}
                className="mt-4 text-zinc-400 hover:text-white text-sm transition-colors"
              >
                ← Back to options
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm text-center mb-6">
                Choose how you want to connect
              </p>

              {/* External Wallet Option */}
              <button
                onClick={handleExternalWallet}
                className="w-full flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 hover:border-[#F5B400]/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-700 group-hover:bg-[#F5B400]/20 flex items-center justify-center transition-colors">
                  <FaWallet className="w-5 h-5 text-[#F5B400]" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium">External Wallet</h3>
                  <p className="text-zinc-400 text-sm">Connect with Nightly or other wallets</p>
                </div>
              </button>

              {/* Email Sign In Option (Invisible Wallet) */}
              <button
                onClick={handleEmailSignIn}
                className="w-full flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 hover:border-[#F5B400]/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-700 group-hover:bg-[#F5B400]/20 flex items-center justify-center transition-colors">
                  <FaEnvelope className="w-5 h-5 text-[#F5B400]" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium">Sign in with Email</h3>
                  <p className="text-zinc-400 text-sm">No wallet needed • Gas-free transactions</p>
                </div>
              </button>

              <p className="text-zinc-500 text-xs text-center mt-6">
                Email sign-in creates a secure embedded wallet with sponsored gas fees
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
