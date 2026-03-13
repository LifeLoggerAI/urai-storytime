'use client';

import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';

// A simple loading spinner component to show while checking auth state
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="w-16 h-16 border-4 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
    <p className="ml-4 text-gray-600">Loading URAI Storytime...</p>
  </div>
);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function for cleanup
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <main className="font-sans">
      {user ? <Dashboard user={user} /> : <Login />}
    </main>
  );
}
