import { X, Trash2, ChevronUp, Save } from "lucide-react";
import { useBetslip } from "@/contexts/BetslipContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSavedBets } from "@/contexts/SavedBetsContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const typeLabel: Record<string, string> = { home: "1", draw: "X", away: "2" };

export function Betslip() {
  const { t } = useTranslation();
  const {
    selections,
    removeSelection,
    clearSelections,
    totalOdds,
    stake,
    setStake,
    potentialWin,
    isOpen,
    setIsOpen,
  } = useBetslip();

  const { saveBet } = useSavedBets();
  const { user } = useAuth();

  const handleConfirm = async () => {
    if (selections.length === 0) return;
    
    // Check if user has enough GP
    if (user && stake > (user.gpBalance || 0)) {
      toast.error(t('betslip.not_enough_gp'));
      return;
    }

    const success = await saveBet({
      selections: selections.map((s) => ({
        matchId: s.matchId,
        homeTeam: s.match.homeTeam,
        awayTeam: s.match.awayTeam,
        league: s.match.league,
        market: s.market,
        selection: s.selection,
        odd: s.odd,
      })),
      totalOdds,
      stake,
      potentialWin,
    });

    if (success) {
      clearSelections();
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating bar on mobile when closed */}
      {selections.length > 0 && !isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 sm:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground"
          >
            <span className="flex items-center gap-2">
              <ChevronUp className="h-4 w-4" />
              {t('betslip.title')} ({selections.length})
            </span>
            <span className="text-primary-foreground font-bold">
              {totalOdds.toFixed(2)}x
            </span>
          </button>
        </div>
      )}

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh] border-border bg-card">
          <DrawerHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
            <DrawerTitle className="text-foreground">
              {t('betslip.title')} ({selections.length})
            </DrawerTitle>
            {selections.length > 0 && (
              <button
                onClick={clearSelections}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                {t('betslip.clear')}
              </button>
            )}
          </DrawerHeader>

          {selections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">{t('betslip.empty')}</p>
              <p className="text-xs">{t('betslip.add_selection') || 'Clicca su una quota per aggiungerla'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto max-h-[45vh] px-4 scrollbar-thin">
                <div className="space-y-2 py-3">
                  {selections.map((sel) => (
                    <div
                      key={sel.matchId}
                      className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          {sel.match.league}
                        </p>
                        <p className="text-sm font-medium">
                          {sel.match.homeTeam} vs {sel.match.awayTeam}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                            {sel.market === "Match Winner" ? (sel.selection === "Home" ? "1" : sel.selection === "Draw" ? "X" : "2") : sel.selection}
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {sel.odd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSelection(sel.matchId)}
                        className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <DrawerFooter className="border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('betslip.total_odds')}</span>
                    <span className="text-lg font-bold text-primary">
                      {totalOdds.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('betslip.stake')}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={user?.gpBalance || 100}
                        value={stake}
                        onChange={(e) => setStake(Number(e.target.value) || 0)}
                        className="h-9 w-24 border-border bg-secondary text-right text-foreground"
                      />
                      {user && (
                        <button 
                          onClick={() => setStake(user.gpBalance || 0)}
                          className="text-[10px] underline text-primary font-medium"
                        >
                          {t('betslip.all') || 'Tutti'} ({user.gpBalance})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                    <span className="text-sm text-muted-foreground">
                      {t('betslip.potential_win')}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {potentialWin.toFixed(0)} GP
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {t('betslip.confirm')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">{t('betslip.confirm_title') || 'Confermare la giocata?'}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          {t('betslip.confirm_desc', { stake: stake }) || `Una volta confermata, la scommessa non potrà essere più annullata o eliminata. L'importo di ${stake} GP verrà detratto dal tuo saldo.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80">{t('betslip.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleConfirm}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {t('betslip.confirm_and_play') || 'Conferma e Gioca'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
