import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wallet, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface Summary {
  total_gross: string | number;
  total_advisor_balance: string | number;
  total_advisor_earned: string | number;
  total_withdrawn: string | number;
}

interface AdvisorStat {
  advisor_id: number;
  advisor_email: string;
  display_name: string;
  total_sales_count: number;
  gross_revenue: string | number;
  expected_advisor_share: string | number;
  current_wallet_balance: string | number;
}

interface Transaction {
  id: number;
  advisor_amount: string | number;
  type: string;
  status: string;
  buyer_email: string;
  advisor_email: string;
  created_at: string;
}

export default function AdminFinance() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [advisors, setAdvisors] = useState<AdvisorStat[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/financial-stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setAdvisors(data.advisors);
        setTransactions(data.transactions);
      } else {
        toast.error("Errore caricamento dati admin", { description: data.error });
      }
    } catch (err) {
      toast.error("Errore di connessione");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-black uppercase italic mb-2">Accesso Negato</h1>
          <p className="text-muted-foreground font-bold text-sm">Questa area è riservata esclusivamente agli amministratori.</p>
        </Card>
      </div>
    );
  }

  const adminProfit = Number(summary?.total_gross || 0) - Number(summary?.total_advisor_earned || 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10 px-4 mt-20">
        <div className="flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-primary" />
                Amministrazione Finanziaria
              </h1>
              <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest mt-1">
                Monitoraggio vendite, commissioni e utili piattaforma
              </p>
            </div>
            <div className="flex items-center gap-2">
               <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-black italic uppercase">
                  Piattaforma Attiva
               </Badge>
            </div>
          </div>

          {/* Cards Riepilogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-border/50 bg-card/50 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Totale Incassato (Gross)</p>
                <p className="text-3xl font-black mt-1">€ {Number(summary?.total_gross || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 italic">Tabella tp_bet_locks</p>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Totale Advisor (50%)</p>
                <p className="text-3xl font-black mt-1">€ {Number(summary?.total_advisor_earned || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 italic">Assegnato agli Advisor</p>
            </Card>

            <Card className="p-6 border-green-500/50 bg-green-500/5 rounded-3xl shadow-lg ring-1 ring-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500/20 p-3 rounded-2xl text-green-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <Badge className="bg-green-500 text-white border-none font-black text-[10px]">UTILE</Badge>
                </div>
                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Utile Amministrazione</p>
                <p className="text-3xl font-black mt-1 text-green-600">€ {adminProfit.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-green-700/60 mt-2 italic">Netto piattaforma (50%)</p>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-500/10 p-3 rounded-2xl text-yellow-600">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Saldo Portafogli Advisor</p>
                <p className="text-3xl font-black mt-1 text-yellow-600">€ {Number(summary?.total_advisor_balance || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 italic">Disponibile per prelievo</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Statistiche Advisor */}
            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
                <h2 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Riepilogo Advisor
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/10">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Advisor</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendite</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tot. Lordo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commissione</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Saldo Attuale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {advisors.map((adv) => (
                      <tr key={adv.advisor_id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-black truncate">{adv.display_name || adv.advisor_email.split('@')[0]}</p>
                          <p className="text-[10px] font-bold text-muted-foreground truncate">{adv.advisor_email}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold">
                          {adv.total_sales_count}
                        </td>
                        <td className="px-6 py-4 text-xs font-black">
                          € {Number(adv.gross_revenue).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-blue-600">
                          € {Number(adv.expected_advisor_share).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-primary">€ {Number(adv.current_wallet_balance).toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Ultime Transazioni */}
            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
                <h2 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Ultime Transazioni
                </h2>
              </div>
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${tx.type === 'sale' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {tx.type === 'sale' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase italic">
                           Vendita a: {tx.buyer_email || 'Utente GP'}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                           Advisor: <span className="text-primary">{tx.advisor_email}</span> • {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-green-600">+ € {Number(tx.advisor_amount).toFixed(2)}</p>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sezione Utile Amministrazione */}
          <Card className="p-8 border-primary/20 bg-primary/5 rounded-3xl shadow-xl mt-4">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="flex items-center gap-6">
                   <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-10 w-10 text-primary" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black italic uppercase italic tracking-tight">Rendimento Piattaforma</h3>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Differenza tra vendite totali e provvigioni erogate</p>
                   </div>
                </div>
                <div className="flex flex-col items-center md:items-end">
                   <div className="text-5xl font-black text-primary italic">€ {adminProfit.toFixed(2)}</div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">Utile Netto Stimato (50%)</div>
                </div>
             </div>
          </Card>

        </div>
      </main>
    </div>
  );
}
