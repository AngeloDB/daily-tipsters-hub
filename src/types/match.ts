export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
  home_draw: number;
  draw_away: number;
  home_away: number;
  gg: number;
  ng: number;
  over25: number;
  under25: number;
}

export interface Match {
  id: string;
  fixture_id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  leagueLogo?: string;
  leagueFlag?: string;
  leagueCountry?: string;
  date: string;
  time: string;
  status: string;
  priority: number;
  odds: MatchOdds;
}

export interface BetSelection {
  matchId: string;
  match: Match;
  type: string; // "home", "draw", "away", etc.
  market: string;
  selection: string;
  odd: number;
}
