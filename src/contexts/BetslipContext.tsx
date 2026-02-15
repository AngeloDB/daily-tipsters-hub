import React, { createContext, useContext, useState, useCallback } from "react";
import type { BetSelection, Match } from "@/types/match";

interface BetslipContextType {
  selections: BetSelection[];
  addSelection: (match: Match, market: string, selection: string, odd: number, type: string) => void;
  removeSelection: (matchId: string) => void;
  clearSelections: () => void;
  getSelection: (matchId: string) => BetSelection | undefined;
  totalOdds: number;
  stake: number;
  setStake: (stake: number) => void;
  potentialWin: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const BetslipContext = createContext<BetslipContextType | undefined>(undefined);

export function BetslipProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState(10);
  const [isOpen, setIsOpen] = useState(false);

  const addSelection = useCallback((match: Match, market: string, selection: string, odd: number, type: string) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.matchId === match.id);
      if (existing) {
        if (existing.market === market && existing.selection === selection) {
          return prev.filter((s) => s.matchId !== match.id);
        }
        return prev.map((s) => (s.matchId === match.id ? { ...s, market, selection, odd, type } : s));
      }
      return [...prev, { matchId: match.id, match, market, selection, odd, type }];
    });
  }, []);

  const removeSelection = useCallback((matchId: string) => {
    setSelections((prev) => prev.filter((s) => s.matchId !== matchId));
  }, []);

  const clearSelections = useCallback(() => setSelections([]), []);

  const getSelection = useCallback(
    (matchId: string) => selections.find((s) => s.matchId === matchId),
    [selections]
  );

  const totalOdds = selections.reduce((acc, s) => acc * s.odd, 1);
  const potentialWin = +(totalOdds * stake).toFixed(2);

  return (
    <BetslipContext.Provider
      value={{
        selections,
        addSelection,
        removeSelection,
        clearSelections,
        getSelection,
        totalOdds,
        stake,
        setStake,
        potentialWin,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </BetslipContext.Provider>
  );
}

export function useBetslip() {
  const ctx = useContext(BetslipContext);
  if (!ctx) throw new Error("useBetslip must be used within BetslipProvider");
  return ctx;
}
