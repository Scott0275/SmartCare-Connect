'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const redirectUser = (userRole: string | null) => {
    if (!userRole) {
      router.push("/unauthorized");
      return;
    }
    switch (userRole) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "doctor":
        router.push("/doctor/dashboard");
        break;
      case "nurse":
        router.push("/nurse/dashboard");
        break;
      case "patient":
        router.push("/patient/dashboard");
        break;
      default:
        router.push("/login");
    }
  };

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const loggedInUser = userCredential.user;
    if (loggedInUser) {
      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role);
        redirectUser(userData.role);
      } else {
        setRole(null);
        await auth.signOut();
        router.push("/login?error=user_data_not_found");
      }
    }
  };

  const signup = async (name: string, email: string, pass: string, role: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role: role,
    });
    setRole(role);
    redirectUser(role);
  };

  const logout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
