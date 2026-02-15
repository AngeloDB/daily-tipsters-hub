import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { Trophy, Star, TrendingUp, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Tipster {
  id: number;
  displayName: string;
  balance: number;
  total_bets: number;
  isAdvisor: boolean;
}

export default function TipstersPage() {
  const { t } = useTranslation();
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tipsters")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTipsters(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const advisors = tipsters.filter((t) => t.isAdvisor);
  // Mostriamo tutti nella sezione community, inclusi gli advisor
  const allTipsters = tipsters;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10 px-4">
        <div className="mb-8 flex items-center gap-4">
          <Link to="/" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {t('tipster.community_title')}
            </h1>
            <p className="text-muted-foreground">{t('tipster.community_subtitle')}</p>
          </div>
        </div>

        {/* ADVISORS SECTION */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-full bg-yellow-500/10 p-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{t('tipster.advisor_section')}</h2>
            <Badge variant="outline" className="ml-2 border-yellow-500/30 text-yellow-600 font-bold">
              10K+ GP
            </Badge>
          </div>
          
          {advisors.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {advisors.map((tipster) => (
                <TipsterCard key={tipster.id} tipster={tipster} isGold />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-yellow-500/30 bg-yellow-500/5 py-12 text-center">
              <p className="text-sm font-bold text-yellow-700/60 uppercase tracking-widest px-4">
                {t('tipster.waiting_advisors')}
              </p>
            </div>
          )}
        </section>

        {/* ALL TIPSTERS SECTION */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{t('tipster.all_section')}</h2>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : allTipsters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">{t('tipster.no_active')}</p>
              <Link to="/" className="mt-4 text-primary hover:underline font-bold">
                {t('tipster.be_first')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {allTipsters.map((tipster) => (
                <TipsterCard key={tipster.id} tipster={tipster} isGold={tipster.isAdvisor} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function TipsterCard({ tipster, isGold }: { tipster: Tipster; isGold?: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className={`group overflow-hidden transition-all hover:shadow-lg ${isGold ? 'border-yellow-500/30 bg-gradient-to-br from-card to-yellow-500/5' : 'hover:border-primary/30'}`}>
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className={`h-14 w-14 border-2 ${isGold ? 'border-yellow-500 shadow-yellow-500/20' : 'border-border'}`}>
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tipster.displayName}`} />
              <AvatarFallback>{tipster.displayName[0]}</AvatarFallback>
            </Avatar>
            {isGold && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-yellow-500 p-1 text-white shadow-lg">
                <Star className="h-3 w-3 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-black text-lg leading-none mb-1 group-hover:text-primary transition-colors text-foreground">
              {tipster.displayName}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold h-5 uppercase">
                {isGold ? 'Advisor' : 'Tipster'}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                <TrendingUp className="h-3 w-3" />
                {t('tipster.bet_plural', { count: tipster.total_bets })}
              </div>
            </div>
          </div>
          {isGold && (
            <Button 
              size="sm" 
              onClick={() => navigate(`/tipster/${tipster.id}`)}
              className="hidden sm:flex items-center gap-1 font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-sm h-8"
            >
              {t('tipster.follow_me')} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        {/* Mobile follow button */}
        {isGold && (
          <Button 
            size="sm" 
            onClick={() => navigate(`/tipster/${tipster.id}`)}
            className="w-full mt-4 flex sm:hidden items-center justify-center gap-2 font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-none"
          >
            {t('tipster.follow_me')} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className={`px-5 py-3 flex items-center justify-between ${isGold ? 'bg-yellow-500/10 border-t border-yellow-500/20' : 'bg-secondary/30 border-t border-border'}`}>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('tipster.current_balance')}</span>
        <span className={`font-black text-lg ${isGold ? 'text-yellow-600' : 'text-primary'}`}>
          GP {tipster.balance.toLocaleString('it-IT')}
        </span>
      </div>
    </Card>
  );
}
