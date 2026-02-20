import { Header } from "@/components/Header";
import { useSavedBets, type SavedBet } from "@/contexts/SavedBetsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaFacebookF } from "react-icons/fa";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/i18n";

function buildShareText(bet: SavedBet, t: any) {
  const isProd = window.location.hostname !== 'localhost';
  const baseUrl = isProd ? 'https://getprono.online' : 'http://localhost:8081';
  
  const lines = bet.selections.map(
    (s) => `• ${s.homeTeam} vs ${s.awayTeam} (${s.market}: ${s.selection} @${s.odd.toFixed(2)})`
  );
  
  return `${t('saved_bets.share')}!\n\n${lines.join("\n")}\n\n${t('betslip.total_odds')}: ${bet.totalOdds.toFixed(2)}\n${t('betslip.stake')}: GP ${bet.stake.toFixed(0)}\n${t('betslip.potential_win')}: GP ${bet.potentialWin.toFixed(0)}`;
}

export default function SavedBetsPage() {
  const { savedBets, deleteBet, refreshBets, isLoading } = useSavedBets();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const isProd = window.location.hostname !== 'localhost';
  const baseUrl = isProd ? 'https://getprono.online' : 'http://localhost:8081';
  const userProfileUrl = user?.id ? `${baseUrl}/tipster/${user.id}` : baseUrl;

  useEffect(() => {
    // Auto refresh every 2 minutes
    const interval = setInterval(() => {
      refreshBets();
    }, 120000);
    return () => clearInterval(interval);
  }, [refreshBets]);

  const handleDelete = async (id: number) => {
    if (window.confirm(t('saved_bets.delete_confirm'))) {
      await deleteBet(id);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-xl font-bold text-foreground">{t('saved_bets.title')}</h2>
          </div>
          <button 
            onClick={() => refreshBets()} 
            disabled={isLoading}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {savedBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-muted-foreground">
            <p className="text-sm">{t('saved_bets.empty')}</p>
            <Link to="/" className="mt-3 text-sm text-primary hover:underline">
              {t('saved_bets.back_to_matches')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {[...savedBets].reverse().map((bet) => (
              <BetCard key={bet.id} bet={bet} onDelete={deleteBet} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BetCard({ bet, onDelete }: { bet: SavedBet; onDelete: (id: any) => void }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const date = new Date(bet.createdAt);

  const isProd = window.location.hostname !== 'localhost';
  const baseUrl = isProd ? 'https://getprono.online' : 'http://localhost:8081';
  const userProfileUrl = user?.id ? `${baseUrl}/tipster/${user.id}` : baseUrl;
  const shareRedirectUrl = (isProd && user?.id) ? `https://getprono.online/share/tipster/${user.id}` : userProfileUrl;

  const statusColors = {
    LIVE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    WON: "bg-green-500/10 text-green-500 border-green-500/20",
    LOST: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const getMatchStatusDisplay = (status: string, minute: string | number | undefined) => {
    const s = status?.toUpperCase();
    if (s === "NS") return "NS";
    if (s === "HT") return "HT";
    if (s === "FT") return "FT";
    if (["1H", "2H", "ET", "P"].includes(s)) return minute ? `${minute}\""` : "LIVE";
    if (["PST", "CANC", "ABD"].includes(s)) return s;
    return s || "NS";
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 transition-all ${bet.status === "WON" ? "ring-2 ring-green-600/30 shadow-md translate-y-[-1px]" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {format(date, "d MMM yyyy, HH:mm", { locale: getDateLocale(i18n.language) })}
          </span>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 font-bold ${statusColors[bet.status]}`}>
            {bet.status}
          </Badge>
          {bet.isSettled && (
             <Badge className="text-[10px] h-5 px-2 bg-green-600 text-white border-none font-bold">
               {t('saved_bets.settled')}
             </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(buildShareText(bet, t) + "\n\n" + userProfileUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-[#25D366]/15 hover:text-[#25D366]"
            title="WhatsApp"
          >
            <FaWhatsapp className="h-4 w-4" />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareRedirectUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-[#1877F2]/15 hover:text-[#1877F2]"
            title="Facebook"
          >
            <FaFacebookF className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => {
              if (window.confirm(t('saved_bets.delete_confirm'))) {
                onDelete(bet.id);
              }
            }}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {bet.selections.map((sel, i) => {
          const mStatus = getMatchStatusDisplay(sel.matchStatus || "NS", sel.matchMinute);
          const isLive = ["1H", "2H", "HT", "ET", "P"].includes(sel.matchStatus || "NS");
          
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{sel.league}</span>
                   <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${mStatus === "FT" ? "bg-secondary text-muted-foreground" : mStatus === "NS" ? "bg-secondary/50 text-muted-foreground" : "bg-red-500/10 text-red-600 animate-pulse"}`}>
                      {isLive && <span className="relative flex h-1.5 w-1.5 mr-0.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span></span>}
                      {mStatus}
                   </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase italic">{sel.market}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground flex items-center gap-2">
                    {sel.homeTeam} 
                    <span className={`px-2 py-0.5 rounded text-xs tabular-nums ${sel.matchStatus === "NS" ? "bg-secondary/30 text-muted-foreground" : "bg-primary/5 text-primary font-black"}`}>
                      {sel.matchStatus === "NS" ? "v" : sel.currentResult || "0 - 0"}
                    </span> 
                    {sel.awayTeam}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-black min-w-[32px] text-center ${sel.isWinning ? "bg-green-600/15 text-green-700 ring-1 ring-green-600/20" : "bg-primary/5 text-primary ring-1 ring-primary/10"}`}>
                    {sel.selection}
                  </span>
                  <span className="font-bold text-sm tabular-nums text-foreground">@{sel.odd.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-dashed border-border pt-4">
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{t('betslip.stake')}</span>
          <span className="font-black text-sm text-foreground">GP {bet.stake.toFixed(0)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{t('betslip.total_odds')}</span>
          <span className="font-black text-sm text-primary">{bet.totalOdds.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{t('betslip.potential_win')}</span>
          <span className={`font-black text-xl leading-none ${bet.status === "WON" ? "text-green-600" : "text-primary"}`}>
            GP {bet.potentialWin.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}
