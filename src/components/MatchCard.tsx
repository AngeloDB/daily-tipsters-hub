import { useState } from "react";
import type { Match } from "@/types/match";
import { useBetslip } from "@/contexts/BetslipContext";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface MatchCardProps {
  match: Match;
}

const oddsConfig: Record<string, { label: string, market: string, selection: string }> = {
  home: { label: "1", market: "Match Winner", selection: "Home" },
  draw: { label: "X", market: "Match Winner", selection: "Draw" },
  away: { label: "2", market: "Match Winner", selection: "Away" },
  home_draw: { label: "1X", market: "Double Chance", selection: "Home/Draw" },
  draw_away: { label: "X2", market: "Double Chance", selection: "Draw/Away" },
  home_away: { label: "12", market: "Double Chance", selection: "Home/Away" },
  gg: { label: "GG", market: "Both Teams Score", selection: "Yes" },
  ng: { label: "NG", market: "Both Teams Score", selection: "No" },
  over25: { label: "O 2.5", market: "Over/Under", selection: "Over 2.5" },
  under25: { label: "U 2.5", market: "Over/Under", selection: "Under 2.5" },
};

const mainOddsKeys = ["home", "draw", "away"];
const extendedOddsKeys = ["home_draw", "draw_away", "home_away", "gg", "ng", "over25", "under25"];

export function MatchCard({ match }: MatchCardProps) {
  const { addSelection, getSelection } = useBetslip();
  const currentSelection = getSelection(match.id);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Match row */}
      <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
        {/* Home team */}
        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {match.homeTeam}
        </span>

        {/* Score / dash */}
        <span className="w-12 text-center text-sm font-bold text-muted-foreground">-</span>

        {/* Away team */}
        <span className="flex-1 truncate text-right text-sm font-medium text-foreground">
          {match.awayTeam}
        </span>

        {/* Time */}
        <span className="ml-3 w-14 text-right text-xs text-muted-foreground">
          {match.time}
        </span>
      </div>

      {/* Main odds row: 1, X, 2 */}
      <div className="flex items-stretch gap-0 border-t border-border/50">
        {mainOddsKeys.map((key) => {
          const config = oddsConfig[key];
          const value = (match.odds as any)[key] as number;
          const isSelected = currentSelection?.type === key;
          
          return (
            <button
              key={key}
              onClick={() => addSelection(match, config.market, config.selection, value, key)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center border-r border-border/50 py-2 text-xs transition-colors last:border-r-0",
                isSelected
                  ? "bg-primary/20 text-primary"
                  : "text-foreground hover:bg-secondary"
              )}
            >
              <span className="text-[10px] text-muted-foreground">{config.label}</span>
              <span className={cn("font-bold", isSelected && "text-primary")}>
                {typeof value === 'number' ? value.toFixed(2) : '1.00'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toggle for extended odds */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 border-t border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-90"
          )}
        />
        <span>Tutte le quote ({extendedOddsKeys.length + mainOddsKeys.length})</span>
      </button>

      {/* Extended odds grid */}
      {expanded && (
        <div className="flex flex-wrap items-stretch border-t border-border/50 bg-secondary/30">
          {extendedOddsKeys.map((key) => {
            const config = oddsConfig[key];
            const value = (match.odds as any)[key] as number;
            const isSelected = currentSelection?.type === key;

            return (
              <button
                key={key}
                onClick={() => addSelection(match, config.market, config.selection, value, key)}
                className={cn(
                  "flex flex-col items-center justify-center border-r border-b border-border/50 px-3 py-2 text-xs transition-colors sm:flex-1",
                  isSelected
                    ? "bg-primary/20 text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
                style={{ minWidth: "calc(100% / 7)" }}
              >
                <span className="text-[10px] text-muted-foreground">{config.label}</span>
                <span className={cn("font-bold", isSelected ? "text-primary" : "text-foreground")}>
                  {typeof value === 'number' ? value.toFixed(2) : '1.00'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
