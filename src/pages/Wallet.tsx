import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import i18n from "@/lib/i18n";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Euro,
  CreditCard,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  type: 'sale' | 'withdrawal';
  status: 'pending' | 'completed' | 'rejected';
  payment_email?: string;
  created_at: string;
}

export default function WalletPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tipster_auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const res = await fetch('/api/advisor/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions);
      } else {
        console.error("Wallet error:", data.error);
      }
    } catch (err) {
      toast.error("Errore nel caricamento del portafoglio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount < 10) {
      toast.error(t('wallet.min_withdraw'));
      return;
    }

    if (amount > balance) {
      toast.error(t('wallet.insufficient'));
      return;
    }

    if (!paypalEmail.includes("@")) {
      toast.error(t('wallet.paypal_error') || "Inserisci un'email PayPal valida");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tipster_auth_token');
      const res = await fetch('/api/advisor/withdraw', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, email: paypalEmail })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('common.success'), { description: "Il prelievo sarà elaborato entro 24/48 ore." });
        setWithdrawAmount("");
        fetchWallet();
      } else {
        toast.error(t('common.error'), { description: data.error });
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group mb-4"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t('nav.back_home')}
        </Link>

        {/* Header Portafoglio */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <WalletIcon className="h-10 w-10 text-primary" />
              {t('wallet.title')}
            </h1>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest mt-1">{t('wallet.subtitle')}</p>
          </div>
          
          <Card className="bg-primary/5 border-primary/20 p-6 rounded-3xl flex items-center gap-6 min-w-[300px]">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <Euro className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('wallet.balance')}</p>
              <p className="text-4xl font-black text-foreground">€ {balance.toFixed(2)}</p>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Prelievo */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-border/50 bg-secondary/20">
                <h2 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {t('wallet.withdraw')}
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('wallet.amount')}</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="Min. € 10.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="rounded-xl border-border/50 bg-background/50 h-12 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t('wallet.paypal_email')}</label>
                    <Input 
                      type="email" 
                      placeholder="La tua email PayPal"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="rounded-xl border-border/50 bg-background/50 h-12 font-bold"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || balance < 10}
                    className="w-full h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground mt-4 shadow-lg shadow-primary/20"
                  >
                    {t('wallet.withdraw_btn')}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  {balance < 10 && (
                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase mt-2">
                      Soglia minima di € 10.00 non raggiunta
                    </p>
                  )}
                </form>
              </div>
              <div className="p-4 bg-secondary/10 border-t border-border/50 text-[10px] text-center font-bold text-muted-foreground uppercase italic px-6">
                I prelievi vengono elaborati tramite PayPal. Tempi medi: 24h.
              </div>
            </Card>

            <Card className="border-yellow-500/20 bg-yellow-500/5 p-6 rounded-3xl">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                  <h3 className="font-black text-sm uppercase italic text-yellow-700">{t('wallet.tax_note')}</h3>
                  <p className="text-xs font-medium text-yellow-700/80 mt-1">
                    {t('wallet.tax_desc')}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Storico Transazioni */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
                <h2 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  {t('wallet.history')}
                </h2>
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary uppercase font-black px-3 py-1">
                  {transactions.length} {t('wallet.activity')}
                </Badge>
              </div>
              
              <div className="divide-y divide-border/50">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${tx.type === 'sale' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {tx.type === 'sale' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase italic">
                            {tx.type === 'sale' ? t('wallet.sale') : t('wallet.withdrawal_req')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {new Date(tx.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {tx.payment_email && (
                              <p className="text-[10px] font-bold text-primary ml-2 uppercase italic">PayPal: {tx.payment_email}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <p className={`text-xl font-black ${tx.type === 'sale' ? 'text-green-600' : 'text-blue-600'}`}>
                          {tx.type === 'sale' ? '+' : '-'} € {tx.amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                          tx.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                          tx.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600' :
                          'bg-destructive/10 border-destructive/20 text-destructive'
                        }`}>
                          {tx.status === 'completed' ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t('wallet.completed')}</span>
                          ) : tx.status === 'pending' ? (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('wallet.pending')}</span>
                          ) : (
                            <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {t('wallet.rejected')}</span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <History className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h3 className="text-xl font-bold text-muted-foreground">{t('wallet.no_transactions')}</h3>
                    <p className="text-muted-foreground mt-2 uppercase text-xs font-black tracking-widest">{t('wallet.idle_desc') || "Le tue attività appariranno qui"}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
