import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it, enUS, es, fr } from "date-fns/locale";
import { Loader2, Ticket } from "lucide-react";
import { Header } from "@/components/Header";
import { useBetslip } from "@/contexts/BetslipContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Match } from "@/types/match"; 
import { useTranslation } from "react-i18next";

// Extended interface to match API response from DB
interface ApiMatch {
    fixture_id: number;
    league_id: number;
    league_name: string;
    league_logo: string;
    league_country: string;
    league_flag: string;
    home_team: string; // Correct DB field
    away_team: string; // Correct DB field
    home_logo: string; // Correct DB field
    away_logo: string; // Correct DB field
    fixture_date: string; // Correct DB field
    status: string;
    odds?: {
        '1'?: number;
        'X'?: number;
        '2'?: number;
        '1X'?: number;
        'X2'?: number;
        '12'?: number;
        'GG'?: number;
        'NG'?: number;
        'O'?: number; // Over 2.5
        'U'?: number; // Under 2.5
    };
}

export default function Matches() {
    const { t, i18n } = useTranslation();
    const [matches, setMatches] = useState<ApiMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addSelection, selections, removeSelection } = useBetslip();

    // Map locale for date-fns
    const getDateLocale = () => {
        switch (i18n.language) {
            case 'en': return enUS;
            case 'es': return es;
            case 'fr': return fr;
            default: return it;
        }
    };

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await fetch(`/api/matches?date=${today}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch matches");
                }

                const data = await response.json();
                if (data.success) {
                    // Store raw API matches
                    setMatches(data.data || []);
                } else {
                    setError(data.error || "Failed to load matches");
                }
            } catch (err: any) {
                console.error("Error fetching matches:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatches();
    }, []);

    // Group matches by league and country to avoid name collisions (e.g., Premier League in different countries)
    const groupedMatches = matches.reduce((acc, match) => {
        // Unique key using country and league name to correctly group matches
        const leagueKey = `${match.league_country}_${match.league_name}`;
        if (!acc[leagueKey]) {
            acc[leagueKey] = {
                name: match.league_name,
                logo: match.league_logo,
                country: match.league_country,
                flag: match.league_flag, // Use flag from API if available
                matches: []
            };
        }
        acc[leagueKey].matches.push(match);
        return acc;
    }, {} as Record<string, { name: string; logo: string; country: string; flag: string; matches: ApiMatch[] }>);

    // Toggle selection handler
    const handleOddClick = (match: ApiMatch, selection: string, odd: number, market: string) => {
        if (!odd) return;

        // Check if already selected
        const isSelected = selections.some(s => s.matchId === match.fixture_id.toString() && s.selection === selection && s.market === market);

        if (isSelected) {
            removeSelection(match.fixture_id.toString());
        } else {
            // Map ApiMatch to Match interface required by BetslipContext
            // Match interface expects: id: number, homeTeam: string, awayTeam: string, league: string, startTime: string
            addSelection({
                id: match.fixture_id,
                homeTeam: match.home_team,
                awayTeam: match.away_team,
                league: match.league_name,
                startTime: match.fixture_date
            }, market, selection, odd, market);
            toast.success(t('matches.added'));
        }
    };

    const isSelected = (matchId: number, selection: string, market: string) => {
        return selections.some(s => s.matchId === matchId.toString() && s.selection === selection && s.market === market);
    };

    const ButtonOdd = ({ match, label, value, market }: { match: ApiMatch, label: string, value?: number, market: string }) => {
        if (!value) return <div className="w-full h-10 bg-muted/20 rounded opacity-50 flex items-center justify-center text-xs">-</div>;

        const selected = isSelected(match.fixture_id, label, market);

        return (
            <button
                onClick={() => handleOddClick(match, label, value, market)}
                className={cn(
                    "w-full h-10 flex flex-col items-center justify-center rounded font-medium transition-colors text-xs border sm:text-sm",
                    selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-secondary border-border text-foreground"
                )}
            >
                <span className="text-[10px] opacity-70 leading-none mb-0.5">{label}</span>
                <span className="font-bold leading-none">{value.toFixed(2)}</span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <main className="container py-6 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('matches.title')}</h1>
                        <p className="text-muted-foreground">
                            {format(new Date(), "d MMMM yyyy", { locale: getDateLocale() })}
                        </p>
                    </div>
                    <div className="hidden sm:block">
                        <Ticket className="h-8 w-8 text-primary opacity-20" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground text-sm">{t('matches.loading')}</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center text-destructive">
                        <p className="font-semibold">{t('common.error')}</p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
                        <p className="text-muted-foreground">{t('matches.no_matches')}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.values(groupedMatches).map((group) => (
                            <div key={group.name} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    {group.logo ? (
                                        <img src={group.logo} alt={group.name} className="h-5 w-5 object-contain" />
                                    ) : (
                                        <div className="h-5 w-5 bg-primary/20 rounded-full" />
                                    )}
                                    <h2 className="font-bold text-lg">{group.name}</h2>
                                    {group.country && <span className="text-xs text-muted-foreground uppercase tracking-wider ml-auto">{group.country}</span>}
                                </div>

                                <div className="grid gap-3">
                                    {group.matches.map((match) => (
                                        <div key={match.fixture_id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            {/* Match Info Row */}
                                            <div className="flex flex-col sm:flex-row">
                                                {/* Teams & Time Section */}
                                                <div className="p-4 flex-1 flex items-center justify-between sm:border-r border-border/50 min-w-0">
                                                    <div className="flex flex-col gap-3 w-full">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-mono text-muted-foreground w-10 text-center bg-secondary/50 rounded py-0.5">
                                                                {format(new Date(match.fixture_date), "HH:mm")}
                                                            </span>
                                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <img src={match.home_logo} alt={match.home_team} className="h-5 w-5 object-contain" />
                                                                    <span className="font-medium truncate text-sm sm:text-base">{match.home_team}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <img src={match.away_logo} alt={match.away_team} className="h-5 w-5 object-contain" />
                                                                    <span className="font-medium truncate text-sm sm:text-base">{match.away_team}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Odds Grid Section */}
                                                <div className="p-3 bg-secondary/10 sm:w-[450px] flex flex-col justify-center gap-2">
                                                    {/* Row 1: 1 X 2 */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <ButtonOdd match={match} label="1" value={match.odds?.['1']} market="1X2" />
                                                        <ButtonOdd match={match} label="X" value={match.odds?.['X']} market="1X2" />
                                                        <ButtonOdd match={match} label="2" value={match.odds?.['2']} market="1X2" />
                                                    </div>
                                                    {/* Row 2: GG NG U O */}
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <ButtonOdd match={match} label="GG" value={match.odds?.['GG']} market="GG/NG" />
                                                        <ButtonOdd match={match} label="NG" value={match.odds?.['NG']} market="GG/NG" />
                                                        <ButtonOdd match={match} label="Ov2.5" value={match.odds?.['O']} market="O/U 2.5" />
                                                        <ButtonOdd match={match} label="Un2.5" value={match.odds?.['U']} market="O/U 2.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
