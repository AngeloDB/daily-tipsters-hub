import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BetslipProvider } from "@/contexts/BetslipContext";
import { SavedBetsProvider } from "@/contexts/SavedBetsContext";
import { TeamsProvider } from "@/contexts/TeamsContext";
import Index from "./pages/Index";
import SavedBets from "./pages/SavedBets";
import Tipsters from "./pages/Tipsters";
import TipsterBets from "./pages/TipsterBets";
import Wallet from "./pages/Wallet";
import AdminFinance from "./pages/AdminFinance";
import Regolamento from "./pages/Regolamento";
import Matches from "./pages/Matches";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TeamsProvider>
          <SavedBetsProvider>
            <BetslipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/schedine" element={<SavedBets />} />
                  <Route path="/tipsters" element={<Tipsters />} />
                  <Route path="/tipster/:id" element={<TipsterBets />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/admin/finance" element={<AdminFinance />} />
                  <Route path="/regolamento" element={<Regolamento />} />
                  <Route path="/partite" element={<Matches />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </BetslipProvider>
          </SavedBetsProvider>
        </TeamsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
