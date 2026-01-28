'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setProcessing(false);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (token) {
        try {
          // Save token and redirect to dashboard
          setToken(token);
          // Small delay to ensure token is saved
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/');
        } catch (err) {
          setError('Failed to complete authentication.');
          setProcessing(false);
          setTimeout(() => router.push('/login'), 3000);
        }
      } else {
        setError('No authentication token received.');
        setProcessing(false);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setToken]);

  return (
    <div className="min-h-screen bg-[#030014] flex items-center justify-center">
      {/* Background Effects */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-30" />
      
      <div className="text-center relative z-10">
        {error ? (
          <div className="space-y-4 animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">{error}</h2>
            <p className="text-gray-400">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up">
            {/* Animated Loader */}
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-fuchsia-500/20 border-b-fuchsia-500 animate-spin" style={{ animationDirection: 'reverse' }} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white">Completing sign in...</h2>
            <p className="text-gray-400">Please wait while we set up your account</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#030014] flex items-center justify-center">
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-30" />
      <div className="relative mx-auto w-16 h-16">
        <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
