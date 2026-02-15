import { Match, MatchOdds } from '@/types/match';

export interface BetSelection {
  matchId: string;
  match: Match;
  type: "home" | "draw" | "away";
  odd: number;
}

export const matches: Match[] = [
  // Serie A
  {
    id: "sa1",
    homeTeam: "Juventus",
    awayTeam: "Inter",
    date: "2026-02-14",
    time: "20:45",
    league: "Serie A",
    odds: { home: 2.40, draw: 3.10, away: 2.95, home_draw: 1.35, draw_away: 1.50, home_away: 1.32, gg: 1.72, ng: 2.00, over25: 1.80, under25: 1.95 },
  },
  {
    id: "sa2",
    homeTeam: "Milan",
    awayTeam: "Napoli",
    date: "2026-02-14",
    time: "18:00",
    league: "Serie A",
    odds: { home: 2.10, draw: 3.30, away: 3.50, home_draw: 1.28, draw_away: 1.68, home_away: 1.30, gg: 1.83, ng: 1.88, over25: 1.75, under25: 2.00 },
  },
  {
    id: "sa3",
    homeTeam: "Roma",
    awayTeam: "Lazio",
    date: "2026-02-15",
    time: "20:45",
    league: "Serie A",
    odds: { home: 2.55, draw: 3.20, away: 2.80, home_draw: 1.40, draw_away: 1.48, home_away: 1.34, gg: 1.65, ng: 2.10, over25: 1.70, under25: 2.05 },
  },
  {
    id: "sa4",
    homeTeam: "Atalanta",
    awayTeam: "Fiorentina",
    date: "2026-02-15",
    time: "15:00",
    league: "Serie A",
    odds: { home: 1.85, draw: 3.50, away: 4.20, home_draw: 1.18, draw_away: 1.88, home_away: 1.28, gg: 1.90, ng: 1.82, over25: 1.65, under25: 2.15 },
  },
  // Premier League
  {
    id: "pl1",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    date: "2026-02-14",
    time: "17:30",
    league: "Premier League",
    odds: { home: 2.20, draw: 3.40, away: 3.10, home_draw: 1.32, draw_away: 1.60, home_away: 1.28, gg: 1.75, ng: 1.95, over25: 1.68, under25: 2.10 },
  },
  {
    id: "pl2",
    homeTeam: "Man City",
    awayTeam: "Chelsea",
    date: "2026-02-15",
    time: "16:00",
    league: "Premier League",
    odds: { home: 1.55, draw: 4.00, away: 5.50, home_draw: 1.12, draw_away: 2.30, home_away: 1.20, gg: 1.88, ng: 1.85, over25: 1.60, under25: 2.20 },
  },
  {
    id: "pl3",
    homeTeam: "Tottenham",
    awayTeam: "Man United",
    date: "2026-02-15",
    time: "14:00",
    league: "Premier League",
    odds: { home: 2.30, draw: 3.30, away: 3.00, home_draw: 1.35, draw_away: 1.55, home_away: 1.30, gg: 1.80, ng: 1.92, over25: 1.72, under25: 2.05 },
  },
  // La Liga
  {
    id: "ll1",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    date: "2026-02-14",
    time: "21:00",
    league: "La Liga",
    odds: { home: 2.15, draw: 3.50, away: 3.20, home_draw: 1.30, draw_away: 1.65, home_away: 1.28, gg: 1.70, ng: 2.02, over25: 1.62, under25: 2.18 },
  },
  {
    id: "ll2",
    homeTeam: "Atletico Madrid",
    awayTeam: "Sevilla",
    date: "2026-02-15",
    time: "18:30",
    league: "La Liga",
    odds: { home: 1.70, draw: 3.60, away: 4.80, home_draw: 1.15, draw_away: 2.05, home_away: 1.25, gg: 1.95, ng: 1.78, over25: 1.58, under25: 2.25 },
  },
  // Bundesliga
  {
    id: "bl1",
    homeTeam: "Bayern Monaco",
    awayTeam: "Dortmund",
    date: "2026-02-14",
    time: "18:30",
    league: "Bundesliga",
    odds: { home: 1.60, draw: 3.80, away: 5.00, home_draw: 1.14, draw_away: 2.15, home_away: 1.22, gg: 1.82, ng: 1.90, over25: 1.55, under25: 2.30 },
  },
  {
    id: "bl2",
    homeTeam: "Leverkusen",
    awayTeam: "RB Lipsia",
    date: "2026-02-15",
    time: "17:30",
    league: "Bundesliga",
    odds: { home: 2.00, draw: 3.40, away: 3.60, home_draw: 1.25, draw_away: 1.72, home_away: 1.28, gg: 1.78, ng: 1.95, over25: 1.70, under25: 2.08 },
  },
];

export function getMatchesByLeague(): Record<string, Match[]> {
  return matches.reduce((acc, match) => {
    if (!acc[match.league]) acc[match.league] = [];
    acc[match.league].push(match);
    return acc;
  }, {} as Record<string, Match[]>);
}
