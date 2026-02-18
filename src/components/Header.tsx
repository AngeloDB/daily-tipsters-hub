import { useState } from "react";
import { Ticket, ClipboardList, LogIn, UserPlus, Menu, X, Trophy, LogOut, User, Users, Wallet as WalletIcon, ShieldCheck } from "lucide-react";
import { useBetslip } from "@/contexts/BetslipContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LoginModal } from "./LoginModal";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";

const languages = [
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
];

export function Header() {
  const { selections, setIsOpen } = useBetslip();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const trackCta = (label: string) => {
    if ((window as any).trackCta) {
      (window as any).trackCta(label);
    }
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    
    // GTM Elite Tracking
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        'event': 'language_change',
        'selected_language': code
      });
    }

    setMenuOpen(false);
  };

  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'it';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex flex-col items-start leading-none shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Daily Tipsters Hub logo" className="h-8 w-8 rounded-full transition-transform group-hover:scale-110" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-primary italic">
              TIPSTERS RACE
            </h1>
          </Link>
          <a 
            href="https://sonoquixquesto.it" 
            className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-muted-foreground ml-10 hover:text-primary transition-colors uppercase"
          >
            {t('nav.home')}
          </a>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link to="/regolamento" onClick={() => trackCta('nav-rules')} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-foreground transition-colors hover:text-primary">
              <Trophy className="h-4 w-4 text-primary" /> {t('nav.regolamento')}
            </Link>
            <Link to="/tipsters" onClick={() => trackCta('nav-tipsters')} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-foreground transition-colors hover:text-primary">
              <Users className="h-4 w-4 text-primary" /> {t('nav.tipsters')}
            </Link>
            <Link to="/schedine" onClick={() => trackCta('nav-my_bets')} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-foreground transition-colors hover:text-primary">
              <ClipboardList className="h-4 w-4 text-primary" /> {t('nav.my_bets')}
            </Link>
            <a 
              href="https://getpronoservizi.it" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackCta('nav-magazine')}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-foreground transition-colors hover:text-primary"
            >
              Magazine 📰
            </a>
            {user?.isAdmin && (
              <Link to="/admin/finance" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold bg-destructive/10 text-destructive transition-all hover:bg-destructive/20 border border-destructive/20">
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            {user && (
              <Link to="/wallet" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold bg-primary/10 text-primary transition-all hover:bg-primary/20 rounded-xl px-3 border border-primary/20">
                <WalletIcon className="h-4 w-4" /> 
                {t('nav.wallet')}
                {user.advisorBalance !== undefined && Number(user.advisorBalance) > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md text-[10px] font-black">
                    € {Number(user.advisorBalance).toFixed(2)}
                  </span>
                )}
              </Link>
            )}
          </div>

          <button onClick={() => setIsOpen(true)} className="relative flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Ticket className="h-4 w-4" /> {t('nav.betslip')}
            {selections.length > 0 && (
              <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-bold text-white border-2 border-card">
                {selections.length}
              </Badge>
            )}
          </button>

          <div className="h-8 w-px bg-border mx-1" />

          {/* User Box - Bordato in un riquadro */}
          {user ? (
            <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 p-1 pl-3 shadow-inner">
              <div className="flex items-center gap-2 pr-3 border-r border-border/50">
                <div className="bg-primary/20 p-1 rounded-md">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-bold truncate max-w-[100px]">{user.email.split('@')[0]}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 border-r border-border/50">
                <span className="text-xs font-black text-primary">GP: {user.gpBalance ?? 0}</span>
              </div>

              <button 
                onClick={logout} 
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                title={t('nav.logout')}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-1 pr-1 pl-1">
              <Button variant="ghost" size="sm" onClick={() => setIsLoginOpen(true)} className="h-8 text-xs font-bold hover:bg-primary/10 hover:text-primary">
                <LogIn className="h-3.5 w-3.5 mr-1" /> {t('nav.login')}
              </Button>
              <a href="https://sonoquixquesto.it/register" target="_blank" rel="noopener noreferrer" className="flex items-center h-8 gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
                <UserPlus className="h-3.5 w-3.5" /> {t('nav.register')}
              </a>
            </div>
          )}

          {/* Lingue in coda */}
          {/* Language Switcher Desktop */}
          <div className="flex items-center gap-2 ml-2 border-l pl-3 border-border/50">
            {languages.map((lang) => (
              <button 
                key={lang.code} 
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${currentLang === lang.code ? 'bg-white/10 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
                title={lang.label}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${currentLang === lang.code ? 'grayscale-0 brightness-110' : 'grayscale'}`}>
                  {lang.flag}
                </span>
                {currentLang === lang.code && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: schedina + hamburger */}
        <div className="flex lg:hidden items-center gap-1.5">
          <button onClick={() => setIsOpen(true)} className="relative flex items-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground">
            <Ticket className="h-3.5 w-3.5" />
            {selections.length > 0 && (
              <Badge className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-xs font-bold text-destructive-foreground">
                {selections.length}
              </Badge>
            )}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-foreground hover:bg-secondary transition-colors">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <div className="container py-4 flex flex-col gap-3">
            {user && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{user.email.split('@')[0]}</span>
                </div>
                <span className="text-sm font-black text-primary">GP: {user.gpBalance ?? 0}</span>
              </div>
            )}
            
            <Link to="/regolamento" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary">
              <Trophy className="h-4 w-4 text-primary" /> {t('nav.regolamento')}
            </Link>
            <Link to="/tipsters" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary">
              <Users className="h-4 w-4 text-primary" /> {t('nav.tipsters')}
            </Link>
            <Link to="/schedine" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary">
              <ClipboardList className="h-4 w-4 text-primary" /> {t('nav.my_bets')}
            </Link>
            <a 
              href="https://getpronoservizi.it" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => { trackCta('nav-magazine-mobile'); setMenuOpen(false); }}
              className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary"
            >
              Magazine 📰
            </a>
            {user?.isAdmin && (
              <Link to="/admin/finance" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-black text-destructive hover:bg-destructive/20">
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            {user && (
              <Link to="/wallet" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-black text-primary hover:bg-primary/20">
                <WalletIcon className="h-4 w-4" /> {t('nav.wallet')}
              </Link>
            )}

            <div className="flex flex-col gap-2 mt-2">
              {user ? (
                <button 
                  onClick={() => { logout(); setMenuOpen(false); }} 
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
                >
                  <LogOut className="h-4 w-4" /> {t('nav.logout')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { setIsLoginOpen(true); setMenuOpen(false); }} 
                    className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-foreground"
                  >
                    <LogIn className="h-4 w-4" /> {t('nav.login')}
                  </button>
                  <a 
                    href="https://sonoquixquesto.it/register" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
                  >
                    <UserPlus className="h-4 w-4" /> {t('nav.register')}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-border/50">
              {languages.map((lang) => (
                <button 
                  key={lang.code} 
                  type="button"
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${currentLang === lang.code ? 'bg-primary/20 border-2 border-primary' : 'bg-secondary/30 border-2 border-transparent opacity-50'}`}
                >
                  <span className={`text-3xl ${currentLang === lang.code ? 'grayscale-0' : 'grayscale'}`}>{lang.flag}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{lang.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {!user && <LoginModal isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />}
    </header>
  );
}
