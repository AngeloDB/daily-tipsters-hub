import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SavedBetSelection {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  selection: string;
  odd: number;
  isWinning?: boolean;
  currentResult?: string;
  matchStatus?: string;
  matchMinute?: string | number;
}

export interface SavedBet {
  id: string;
  selections: SavedBetSelection[];
  totalOdds: number;
  stake: number;
  potentialWin: number;
  createdAt: string;
  status: 'LIVE' | 'WON' | 'LOST';
  isSettled: boolean;
}

interface SavedBetsContextType {
  savedBets: SavedBet[];
  saveBet: (bet: Omit<SavedBet, "id" | "createdAt">) => Promise<boolean>;
  deleteBet: (id: string) => Promise<boolean>;
  refreshBets: () => Promise<void>;
  isLoading: boolean;
}

const SavedBetsContext = createContext<SavedBetsContextType | undefined>(undefined);

const STORAGE_KEY = "tipster_saved_bets";

export function SavedBetsProvider({ children }: { children: React.ReactNode }) {
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [savedBets, setSavedBets] = useState<SavedBet[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const refreshBets = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/saved-bets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Map backend data to frontend format
        const mapped = data.data.map((b: any) => ({
          id: String(b.id),
          totalOdds: Number(b.total_odds),
          stake: Number(b.stake),
          potentialWin: Number(b.potential_win),
          createdAt: b.created_at,
          status: b.status,
          isSettled: Boolean(b.is_settled),
          selections: b.selections.map((s: any) => ({
            matchId: String(s.match_id),
            homeTeam: s.home_team,
            awayTeam: s.away_team,
            league: s.league_name,
            market: s.market,
            selection: s.selection,
            odd: Number(s.odd),
            isWinning: s.isWinning,
            currentResult: s.currentResult,
            matchStatus: s.matchStatus,
            matchMinute: s.matchMinute
          }))
        }));
        setSavedBets(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch saved bets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      refreshBets();
    } else {
      // Load from local storage if not logged in
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedBets(JSON.parse(stored));
    }
  }, [user, token, refreshBets]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBets));
    }
  }, [savedBets, user]);

  const saveBet = useCallback(async (bet: Omit<SavedBet, "id" | "createdAt">) => {
    if (user && token) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/saved-bets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(bet)
        });
        const data = await response.json();
        if (data.success) {
          toast({ title: "Scommessa salvata!", description: "La trovi nella sezione 'Le tue schedine'." });
          await refreshUser();
          await refreshBets();
          return true;
        } else {
          toast({ variant: "destructive", title: "Errore", description: data.error || "Impossibile salvare la scommessa." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Errore", description: "Impossibile salvare la scommessa sul server." });
      } finally {
        setIsLoading(false);
      }
      return false;
    } else {
      const newBet: SavedBet = {
        ...bet,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setSavedBets((prev) => [newBet, ...prev]);
      toast({ title: "Scommessa salvata localmente!", description: "Accedi per salvarla nel tuo profilo." });
      return true;
    }
  }, [user, token, refreshBets, toast]);

  const deleteBet = useCallback(async (id: string) => {
    if (user && token) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/saved-bets/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          await refreshBets();
          return true;
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare la scommessa." });
      } finally {
        setIsLoading(false);
      }
      return false;
    } else {
      setSavedBets((prev) => prev.filter((b) => b.id !== id));
      return true;
    }
  }, [user, token, refreshBets, toast]);

  return (
    <SavedBetsContext.Provider value={{ savedBets, saveBet, deleteBet, refreshBets, isLoading }}>
      {children}
    </SavedBetsContext.Provider>
  );
}

export function useSavedBets() {
  const ctx = useContext(SavedBetsContext);
  if (!ctx) throw new Error("useSavedBets must be used within SavedBetsProvider");
  return ctx;
}
