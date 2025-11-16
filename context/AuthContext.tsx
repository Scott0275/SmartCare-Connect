"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { auth } from "../firebase/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { useRouter } from "next/navigation";
import useAutoSync from "@/hooks/useAutoSync";

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
  login: async () => {},
});

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useAutoSync();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const roleRef = doc(db, "users", currentUser.uid);
          const roleSnap = await getDoc(roleRef);
          if (roleSnap.exists()) {
            const data = roleSnap.data();
            setRole((data as any).role || null);
          } else {
            setRole(null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = cred.user;
      setUser(currentUser);

      // fetch role from firestore
      const roleRef = doc(db, "users", currentUser.uid);
      const roleSnap = await getDoc(roleRef);
      const fetchedRole = roleSnap.exists() ? (roleSnap.data() as any).role : null;
      setRole(fetchedRole || null);

      // Redirect based on role
      switch (fetchedRole) {
        case "admin":
          router.push("/admin");
          break;
        case "nurse":
          router.push("/nurse/dashboard");
          break;
        case "doctor":
          router.push("/doctor/dashboard");
          break;
        case "patient":
          router.push("/patient/dashboard");
          break;
        default:
          router.push("/");
      }
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

// Keep backwards-compatible export name expected across the app
export const AuthProvider = AuthContextProvider;

export const useAuth = () => useContext(AuthContext);
