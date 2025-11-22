"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import useAutoSync from "@/hooks/useAutoSync";
import { awsAuth, CognitoUser } from "../lib/aws-auth";

interface AuthContextType {
  user: User | CognitoUser | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  isAWSAuth: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
  login: async () => {},
  isAWSAuth: false,
});

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | CognitoUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isAWSAuth = process.env.NEXT_PUBLIC_USE_AWS === 'true';
  
  useAutoSync();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
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
      if (isAWSAuth) {
        // AWS Cognito login
        const cognitoUser = await awsAuth.signIn(email, password);
        setUser(cognitoUser);
        setRole(cognitoUser.role || null);
        
        // Store tokens in localStorage
        localStorage.setItem('aws_access_token', cognitoUser.accessToken);
        localStorage.setItem('aws_id_token', cognitoUser.idToken);
        localStorage.setItem('aws_refresh_token', cognitoUser.refreshToken);
        
        redirectByRole(cognitoUser.role);
      } else {
        // Firebase login
        if (!auth || !db) {
          throw new Error('Firebase not initialized - check environment variables');
        }
        
        const { requireOnlineForAuth } = await import('@/lib/authService');
        await requireOnlineForAuth();
        
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const currentUser = cred.user;
        setUser(currentUser);

        const roleRef = doc(db, "users", currentUser.uid);
        const roleSnap = await getDoc(roleRef);
        const fetchedRole = roleSnap.exists() ? (roleSnap.data() as any).role : null;
        setRole(fetchedRole || null);
        
        redirectByRole(fetchedRole);
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const redirectByRole = (userRole: string | null) => {
    switch (userRole) {
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
      case "labtech":
        router.push("/labtech/dashboard");
        break;
      case "pharmacy":
        router.push("/pharmacy/dashboard");
        break;
      default:
        router.push("/");
    }
  };

  const logout = async () => {
    if (isAWSAuth) {
      // AWS logout - clear tokens
      localStorage.removeItem('aws_access_token');
      localStorage.removeItem('aws_id_token');
      localStorage.removeItem('aws_refresh_token');
    } else {
      // Firebase logout
      if (auth) {
        await firebaseSignOut(auth);
      }
    }
    setUser(null);
    setRole(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, login, isAWSAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Keep backwards-compatible export name expected across the app
export const AuthProvider = AuthContextProvider;

export const useAuth = () => useContext(AuthContext);
