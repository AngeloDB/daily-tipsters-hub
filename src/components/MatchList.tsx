import { useState, useMemo } from "react";
import { useMatches } from "@/hooks/use-matches";
import { MatchCard } from "./MatchCard";
import { ChevronUp, Loader2, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export function MatchList() {
  const { t } = useTranslation();
  const { matches, loading, error } = useMatches();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("all");

  const leagueOptions = useMemo(() => {
    const leaguesMap = new Map<string, { name: string, priority: number }>();
    matches.forEach(m => {
      if (!leaguesMap.has(m.league)) {
        leaguesMap.set(m.league, { name: m.league, priority: m.priority });
      }
    });

    return Array.from(leaguesMap.values()).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchesSearch = 
        match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.league.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLeague = selectedLeague === "all" || match.league === selectedLeague;

      return matchesSearch && matchesLeague;
    });
  }, [matches, searchTerm, selectedLeague]);

  const matchesByLeague = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredMatches.forEach((match) => {
      if (!grouped[match.league]) {
        grouped[match.league] = [];
      }
      grouped[match.league].push(match);
    });
    return grouped;
  }, [filteredMatches]);

  const sortedLeagues = useMemo(() => {
    const leagues = Object.entries(matchesByLeague);
    // Sort leagues by the minimum priority of any match in that league
    return leagues.sort((a, b) => {
      const priorityA = a[1][0]?.priority ?? 1000;
      const priorityB = b[1][0]?.priority ?? 1000;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a[0].localeCompare(b[0]);
    });
  }, [matchesByLeague]);

  if (loading && matches.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-destructive font-medium">{t('home.load_error')}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-col gap-3 rounded-xl bg-card p-4 border border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('home.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>

          {/* League Select */}
          <div className="w-full sm:w-[240px]">
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder={t('home.all_leagues')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('home.all_leagues')}</SelectItem>
                {leagueOptions.map((league) => (
                  <SelectItem key={league.name} value={league.name}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredMatches.length === 0 && !loading && (
          <p className="text-xs text-center text-muted-foreground py-2">
            {t('home.no_results')}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {sortedLeagues.map(([league, matches]) => (
          <LeagueSection
            key={league}
            league={league}
            country={matches[0]?.leagueCountry}
            flag={matches[0]?.leagueFlag}
            matchCount={matches.length}
            logo={matches[0]?.leagueLogo}
          >
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </LeagueSection>
        ))}
      </div>
    </div>
  );
}

function LeagueSection({
  league,
  country,
  flag,
  matchCount,
  logo,
  children,
}: {
  league: string;
  country?: string;
  flag?: string;
  matchCount: number;
  logo?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      {/* League header bar */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-secondary px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          {flag ? (
            <img src={flag} alt={country} className="h-4 w-6 object-contain rounded-sm" />
          ) : logo ? (
            <img src={logo} alt={league} className="h-5 w-5 object-contain" />
          ) : null}
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">
              {country || 'Altro'}
            </span>
            <span className="text-sm font-bold uppercase tracking-wider text-secondary-foreground">     
              {league}
            </span>
          </div>
          <span className="text-[10px] bg-background/50 px-1.5 rounded text-muted-foreground ml-1">   
            {matchCount}
          </span>
        </div>
        <ChevronUp className={cn("h-4 w-4 text-muted-foreground transition-transform", !open && "rotate-180")} />
      </button>

      {/* Matches container */}
      <div className={cn("divide-y divide-border", !open && "hidden")}>
        {children}
      </div>
    </section>
  );
}
