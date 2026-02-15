import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock, Ticket, Calendar, TrendingUp, Share2, CheckCircle2, Trophy, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface BetMatch {
  home_team: string;
  away_team: string;
  market: string;
  selection: string;
  odd: number;
  match_date: string;
  isExpired: boolean;
}

interface Bet {
  id: number;
  total_odds: number;
  match_count: number;
  price: string;
  created_at: string;
  potential_win: number;
  stake: number;
  is_obscured: boolean;
  matches?: BetMatch[];
}

interface TipsterInfo {
  id: number;
  displayName: string;
  isAdvisor: boolean;
  balance: number;
  total_bets?: number;
}

export default function TipsterBetsPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [bets, setBets] = useState<Bet[]>([]);
  const [tipster, setTipster] = useState<TipsterInfo | null>(null);
  const [topTipsters, setTopTipsters] = useState<TipsterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedBets, setUnlockedBets] = useState<number[]>([]);

  const handleUnlock = async (betId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('nav.login_required') || "Devi essere loggato per sbloccare le schedine");
        return;
      }

      const res = await fetch(`/api/bets/${betId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('tipster.unlock_success') || "Evento Sbloccato!", { description: "Le partite ora sono visibili." });
        setUnlockedBets(prev => [...prev, betId]);
      } else {
        toast.error(t('common.error'), { description: data.error });
      }
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    // Fetch Tipster Public Bets
    fetch(`/api/tipsters/${id}/public-bets`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const betsWithMatches = data.data.map(async (bet: Bet) => {
            const res = await fetch(`/api/bets/${bet.id}/public-matches`);
            const mData = await res.json();
            return { ...bet, matches: mData.data };
          });

          Promise.all(betsWithMatches).then(completedBets => {
            setBets(completedBets);
            const unlocked = (completedBets as any[]).filter(b => b.is_unlocked).map(b => b.id);
            setUnlockedBets(unlocked);
          });
          setTipster(data.tipster);
        }
      })
      .catch(err => console.error("Error fetching bets:", err))
      .finally(() => setIsLoading(false));

    // Fetch Top Tipsters for Sidebar
    fetch("/api/tipsters")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const sorted = data.data
            .sort((a: any, b: any) => b.balance - a.balance)
            .slice(0, 10);
          setTopTipsters(sorted);
        }
      })
      .catch(err => console.error("Error fetching top tipsters:", err));
  }, [id]);

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = t('tipster.share_text', { name: tipster?.displayName });
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success(t('tipster.link_copied'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-10 px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Header />
      <main className="container flex-1 py-10 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Area Contenuto Principale */}
          <div className="flex-1 min-w-0">
            {/* Header del Profilo Advisor */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4">
                <Link to="/tipsters" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-xl shadow-yellow-500/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tipster?.displayName}`} />
                      <AvatarFallback>{tipster?.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5 border-4 border-card">
                      <CheckCircle2 className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground italic uppercase">
                      {tipster?.displayName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white font-black border-none uppercase text-[10px] tracking-wider px-3">
                        {t('tipster.advisor_badge')}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-bold flex items-center gap-1">
                        <Ticket className="h-4 w-4" /> {bets.length} {t('tipster.no_bets_count') || 'Schedine in vendita'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare('whatsapp')} className="rounded-full h-10 w-10 p-0 border-green-500/20 hover:bg-green-500/10 hover:text-green-600">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.55 4.197 1.592 6.015L0 24l6.149-1.613a11.758 11.758 0 005.895 1.563h.006c6.635 0 12.05-5.414 12.05-12.05 0-3.212-1.25-6.233-3.522-8.505"/></svg>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('facebook')} className="rounded-full h-10 w-10 p-0 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-600">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="rounded-full h-10 w-10 p-0 border-primary/20 hover:bg-primary/10 hover:text-primary">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Griglia Schedine */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {bets.length > 0 ? (
                bets.map((bet) => (
                  <Card key={bet.id} className="group relative border-border/50 bg-card/50 overflow-hidden hover:border-yellow-500/30 transition-all hover:shadow-2xl flex flex-col rounded-3xl">
                    {/* Header Schedina */}
                    <div className="p-6 border-b border-border/50 bg-secondary/20 font-black italic">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-6 w-6 text-primary" />
                          <span className="text-xl uppercase">TOP RACE #{bet.id}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1">
                          {t('tipster.event_count', { count: bet.match_count })}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('tipster.total_odds')}</span>
                          <span className="text-2xl font-black">@{bet.total_odds}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('tipster.gp_win')}</span>
                          <span className="text-2xl font-black text-green-600">GP {bet.potential_win.toLocaleString('it-IT')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Partite Offuscate */}
                    <div className="p-6 flex-1 space-y-3">
                      {bet.matches?.map((match, idx) => (
                        <div 
                          key={idx} 
                          className={`relative flex items-center justify-between p-3 rounded-xl border ${match.isExpired ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary/40 border-border/50'}`}
                        >
                          <div className={`flex flex-col flex-1 ${unlockedBets.includes(bet.id) ? '' : 'filter blur-[4px] select-none'}`}>
                            <span className="text-xs font-black truncate">{match.home_team} vs {match.away_team}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{match.market}: {match.selection}</span>
                          </div>
                          {match.isExpired && (
                            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-xl">
                              <Badge variant="destructive" className="font-black text-[10px] uppercase">{t('tipster.expired')}</Badge>
                            </div>
                          )}
                          {!match.isExpired && (
                            <div className={`flex items-center gap-2 ${unlockedBets.includes(bet.id) ? '' : 'filter blur-[3px]'}`}>
                              <Badge className="font-black h-5">@{match.odd}</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Box Acquisto */}
                    <div className="p-6 pt-0 mt-auto">
                      <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5 text-center flex flex-col items-center">
                        <div className={`mb-4 rounded-full p-3 ${unlockedBets.includes(bet.id) ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                          {unlockedBets.includes(bet.id) ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-4">
                          {unlockedBets.includes(bet.id) ? t('tipster.full_access') || 'ACCESSO COMPLETO' : t('tipster.price')}
                        </p>
                        <div className="text-4xl font-black text-foreground mb-6">
                          {unlockedBets.includes(bet.id) ? t('tipster.unlocked') : `€ ${bet.price}`}
                        </div>
                        
                        <Button 
                          onClick={() => unlockedBets.includes(bet.id) ? null : handleUnlock(bet.id)}
                          disabled={unlockedBets.includes(bet.id)}
                          className={`w-full gap-2 font-black h-12 rounded-xl shadow-lg transition-all ${
                            unlockedBets.includes(bet.id) 
                            ? 'bg-green-600 hover:bg-green-600 cursor-default' 
                            : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                          {unlockedBets.includes(bet.id) ? (
                            <>
                              <CheckCircle2 className="h-5 w-5" />
                              {t('tipster.visible') || 'VISIBILE'}
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-5 w-5" />
                              {t('tipster.unlock')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Footer Statistiche */}
                    <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between text-[11px] font-bold text-muted-foreground bg-secondary/10 mt-auto italic">
                      <div className="flex items-center gap-1.5 uppercase">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(bet.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-primary uppercase">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {t('tipster.stake')}: {bet.stake} GP
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <Ticket className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-xl font-bold text-muted-foreground">{t('tipster.no_bets')}</h3>
                  <p className="text-muted-foreground mt-2">{t('tipster.no_bets_desc') || 'Nessuna schedina disponibile per la vendita.'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Destra - Top 10 Tipsters */}
          <div className="lg:w-80 shrink-0">
            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden sticky top-24 shadow-sm">
              <div className="p-6 border-b border-border/50 bg-secondary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-lg font-black italic uppercase tracking-tighter">{t('tipster.top_ten')}</h2>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('tipster.gp_ranking')}</p>
              </div>
              
              <div className="p-2 space-y-1">
                {topTipsters.map((t, idx) => (
                  <Link 
                    key={t.id} 
                    to={`/tipster/${t.id}`}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-secondary/50 group ${t.id === Number(id) ? 'bg-primary/10 ring-1 ring-primary/20' : ''}`}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.displayName}`} />
                      <AvatarFallback>{t.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate group-hover:text-primary transition-colors">{t.displayName}</p>
                      <p className="text-[10px] font-bold text-primary italic uppercase">GP {t.balance.toLocaleString('it-IT')}</p>
                    </div>
                    {t.isAdvisor && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />
                    )}
                  </Link>
                ))}
              </div>
              
              <div className="p-4 bg-secondary/10 border-t border-border/50 text-center">
                <Link to="/tipsters" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  {t('tipster.full_ranking')}
                </Link>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}


