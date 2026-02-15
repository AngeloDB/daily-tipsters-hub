import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  email_verified: boolean;
  gpBalance?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Check URL first for SSO
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      console.log("[Auth] Token found in URL, using for SSO");
      // Basic URL cleanup - we'll do fuller cleanup in an effect
      return urlToken;
    }
    return localStorage.getItem("tipster_auth_token");
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      // If we have a token in the URL, clean the URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const effectiveToken = token;
      
      console.log("[Auth] Initializing with token:", effectiveToken ? effectiveToken.substring(0, 10) + "..." : "none");

      if (effectiveToken) {
        try {
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${effectiveToken}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              console.log("[Auth] Token valid, user set:", data.user.email);
              setUser(data.user);
              // Save to localStorage if not already there
              localStorage.setItem("tipster_auth_token", effectiveToken);
            } else {
              console.log("[Auth] Token fetch succeeded but success=false or no user", data);
              setToken(null);
              localStorage.removeItem("tipster_auth_token");
            }
          } else {
            console.error("[Auth] Token validation failed with status:", response.status);
            setToken(null);
            localStorage.removeItem("tipster_auth_token");
          }
        } catch (error) {
          console.error("[Auth] Error during token validation fetch:", error);
        }
      }

      // If no token or token validation failed, try cookie auto-login
      if (!user && !effectiveToken) {
        try {
          console.log("[Auth] Attempting auto-login via cookie...");
          // Call /api/auth/me with credentials: 'include' to send cookies
          // Note: using direct fetch here to ensure we handle the response correctly
          const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              console.log("[Auth] Auto-login success!", data.user);
              // We don't have a raw token here because it's in the cookie.
              // But our context expects a token. 
              // We can either:
              // A) Change context to allow null token (but logged in)
              // B) Just use a dummy string since subsequent requests will use cookie anyway (if we configure them)
              // Let's use a dummy token marker or try to get it if the API returned it (current API /auth/me doesn't return token)
              // Actually, for consistency, let's keep token as null in state but user as set.
              // AND we need to ensure all future API calls use credentials: 'include'.

              setUser(data.user);
              // Optionally mark that we are using cookie session
            }
        } else {
            // Log the full response for debugging
            try {
              const errorData = await response.json();
              console.log("[Auth] Auto-login failed. Server response:", errorData);
            } catch (jsonError) {
              console.log("[Auth] Auto-login failed (Status: " + response.status + "), could not parse JSON.");
            }
          }
        } catch (e) {
          console.log("[Auth] Auto-login network/code error", e);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("tipster_auth_token", newToken);
    toast({
      title: "Bentornato!",
      description: `Hai effettuato l'accesso come ${newUser.email}`,
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("tipster_auth_token");
    toast({
      title: "Logged out",
      description: "Sessione terminata correttamente",
    });
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("[Auth] Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
