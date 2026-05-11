
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./lib/firebase";
import Login from "./components/Login";
import { signOut } from "firebase/auth";

export default function Home() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
      <p className="mb-4">You are now logged into the root application.</p>
      <button
        onClick={() => signOut(auth)}
        className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Sign Out
      </button>
    </div>
  );
}
