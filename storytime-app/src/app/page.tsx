'use client';

import { useAuth } from '@/hooks/useAuth';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {user ? <Dashboard /> : <Login />}
    </main>
  );
}
