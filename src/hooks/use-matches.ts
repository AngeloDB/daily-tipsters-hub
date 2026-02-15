import { useEffect, useState } from 'react';
import type { Match, MatchOdds } from '@/types/match';
import { useAuth } from '@/contexts/AuthContext';

export interface ApiResponse {
  success: boolean;
  count?: number;
  data?: any[];
  error?: string;
}

const API_URL = '/api';

export function useMatches(date?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    let ignore = false;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        const url = date ? `${API_URL}/matches/date/${date}` : `${API_URL}/matches`;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(url, { headers });   
        const data: ApiResponse = await response.json();

        if (ignore) return;

        if (data.success && data.data) {
          // Map backend data to frontend Match interface
          const mappedMatches: Match[] = data.data.map((m: any) => {
            // Use normalized_odds from backend
            const n = m.normalized_odds || {};
            
            // Add safety check: log one match to see if odds are present
            // console.log('Match odds from API:', m.fixture_id, n);

            const odds: MatchOdds = {
              home: Number(n['1']) || 1.0,
              draw: Number(n['X']) || 1.0,
              away: Number(n['2']) || 1.0,
              home_draw: Number(n['1X']) || 1.0,
              draw_away: Number(n['X2']) || 1.0,
              home_away: Number(n['12']) || 1.0,
              gg: Number(n['GG']) || 1.0,
              ng: Number(n['NG']) || 1.0,
              over25: Number(n['O']) || 1.0,
              under25: Number(n['U']) || 1.0
            };

            const fixtureDate = new Date(m.fixture_date);
            const dateStr = fixtureDate.toISOString();

            return {
              id: String(m.fixture_id),
              fixture_id: m.fixture_id,
              homeTeam: m.home_team,
              awayTeam: m.away_team,
              homeLogo: m.home_logo,
              awayLogo: m.away_logo,
              date: dateStr.split('T')[0],
              time: fixtureDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
              league: m.league_name,
              leagueLogo: m.league_logo,
              leagueFlag: m.league_flag,
              leagueCountry: m.league_country,
              status: m.status,
              priority: m.priority || 1000,
              odds
            };
          });

          setMatches(mappedMatches);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch matches');
        }
      } catch (err) {
        if (ignore) return;
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');    
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchMatches();
    
    // Refresh every 1 minute
    const interval = setInterval(fetchMatches, 60000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [date]);

  return { matches, loading, error };
}
