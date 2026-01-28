'use client';

import { useState } from 'react';
import Link from 'next/link';
import { oauthUrls } from '@/lib/api';

export default function RegisterPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleSignup = () => {
    setLoading('google');
    window.location.href = oauthUrls.google;
  };

  const handleFacebookSignup = () => {
    setLoading('facebook');
    window.location.href = oauthUrls.facebook;
  };

  return (
    <div className="min-h-screen bg-[#030014] flex">
      {/* Left Side - Social Signup */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Background for mobile */}
        <div className="absolute inset-0 gradient-mesh pointer-events-none opacity-30 lg:hidden" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">Tracker</span>
          </Link>

          {/* Card */}
          <div className="glass-card rounded-3xl p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
              <p className="text-gray-400">Get started with your social account</p>
            </div>

            {/* Social Buttons */}
            <div className="space-y-4">
              {/* Google Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white text-gray-800 font-semibold rounded-2xl transition-all duration-300 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading === 'google' ? (
                  <svg className="animate-spin h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Sign up with Google</span>
              </button>

              {/* Facebook Button */}
              <button
                onClick={handleFacebookSignup}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-[#1877F2] text-white font-semibold rounded-2xl transition-all duration-300 hover:bg-[#166FE5] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading === 'facebook' ? (
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                <span>Sign up with Facebook</span>
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-8 p-4 bg-white/5 rounded-2xl">
              <p className="text-gray-400 text-sm mb-3">Why sign up with social?</p>
              <ul className="space-y-2">
                {[
                  'No password to create or remember',
                  'Faster sign-in experience',
                  'Secure OAuth 2.0 authentication',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Info */}
            <p className="text-center text-gray-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition">
                Sign in
              </Link>
            </p>

            {/* Terms */}
            <p className="text-center text-gray-600 text-xs mt-6">
              By signing up, you agree to our{' '}
              <a href="#" className="text-gray-400 hover:text-gray-300 transition">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-gray-400 hover:text-gray-300 transition">Privacy Policy</a>
            </p>
          </div>

          {/* Back to Home */}
          <Link href="/" className="flex items-center justify-center gap-2 mt-8 text-gray-500 hover:text-gray-300 transition group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Right Side - Branding/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-fuchsia-600/20 via-violet-600/20 to-purple-900/20" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        
        {/* Floating Orbs */}
        <div className="orb orb-pink w-[500px] h-[500px] -top-32 -right-32 animate-float" />
        <div className="orb orb-purple w-[400px] h-[400px] bottom-0 left-0 animate-float" style={{ animationDelay: '3s' }} />
        <div className="orb orb-blue w-[300px] h-[300px] top-1/2 right-1/2 animate-float" style={{ animationDelay: '1.5s' }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Tracker</span>
          </Link>
          
          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight mb-4">
                Start your<br />
                <span className="gradient-text">journey today.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-md">
                Join thousands of users building amazing things with our platform.
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '10K+', label: 'Users' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map((stat, i) => (
                <div key={i} className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Testimonial */}
          <div className="glass-card rounded-2xl p-6 max-w-md">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-300 mb-4">
              "Signing up was incredibly easy. Just one click with my Google account and I was in!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div>
                <p className="text-white font-medium">Sarah Chen</p>
                <p className="text-gray-500 text-sm">Product Designer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
