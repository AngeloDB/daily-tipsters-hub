import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { it, enGB, es, fr } from 'date-fns/locale';

const resources = {
  it: {
    translation: {
      "nav": {
        "regolamento": "Regolamento",
        "tipsters": "Tipsters",
        "my_bets": "Le tue schedine",
        "wallet": "Portafoglio (€)",
        "betslip": "Schedina",
        "login": "Accedi",
        "logout": "Esci",
        "register": "Registrati",
        "home": "LIVESCORE & PRONOSTICI",
        "back_home": "Torna alla Home"
      },
      "betslip": {
        "title": "Schedina",
        "empty": "La tua schedina è vuota",
        "add_selection": "Clicca su una quota per aggiungerla",
        "clear": "Svuota tutto",
        "stake": "Puntata GP",
        "all": "Tutti",
        "potential_win": "Vincita Potenziale",
        "confirm": "CONFERMA GIOCATA",
        "confirm_title": "Confermare la giocata?",
        "confirm_desc": "Una volta confermata, la scommessa non potrà essere più annullata o eliminata. L'importo di {{stake}} GP verrà detratto dal tuo saldo.",
        "confirm_and_play": "Conferma e Gioca",
        "saving": "Salvataggio...",
        "not_enough_gp": "Non hai abbastanza GP Points!",
        "success": "Schedina salvata con successo!",
        "total_odds": "Quota Totale",
        "clear_confirm": "Sei sicuro di voler svuotare la schedina?",
        "cancel": "Annulla",
        "delete": "Elimina"
      },
      "wallet": {
        "title": "Il Mio Portafoglio",
        "subtitle": "Gestione guadagni e prelievi",
        "balance": "Saldo Disponibile",
        "withdraw": "Richiedi Prelievo",
        "amount": "Importo (€)",
        "paypal_email": "Email PayPal",
        "withdraw_btn": "PRELEVA ORA",
        "min_withdraw": "L'importo minimo per il prelievo è € 10.00",
        "insufficient": "Saldo insufficiente",
        "history": "Storico Operazioni",
        "activity": "ATTIVITÀ",
        "sale": "Vendita Schedina",
        "withdrawal_req": "Richiesta Prelievo",
        "completed": "COMPLETATO",
        "pending": "IN ATTESA",
        "rejected": "RIFIUTATO",
        "no_transactions": "Nessuna transazione",
        "tax_note": "Nota sulle Tasse",
        "tax_desc": "Eventuali oneri fiscali sono a carico del ricevente. Tipsters Race non trattiene commissioni sui tuoi guadagni."
      },
      "tipster": {
        "top_ten": "Top Ten Tipster",
        "gp_ranking": "Classifica Generale GP",
        "full_ranking": "Classifica Completa",
        "event_count": "{{count}} EVENTI",
        "total_odds": "Quota Totale",
        "gp_win": "GP Vincita",
        "stake": "STAKE",
        "price": "Prezzo Schedina",
        "unlock": "SBLOCCA ORA",
        "unlocked": "SBLOCCATA",
        "expired": "SCADUTA",
        "no_bets": "Nessuna schedina disponibile",
        "follow_me": "SEGUIMI",
        "advisor_badge": "ADVISOR CERTIFICATO",
        "share_text": "Guarda le schedine vincitrici di {{name}} su Tipsters Race!",
        "link_copied": "Link copiato negli appunti!",
        "community_title": "Tipsters Community",
        "community_subtitle": "Scopri i migliori esperti e segui le loro giocate.",
        "advisor_section": "Tipsters Advisor",
        "all_section": "Tutti i Tipsters",
        "waiting_advisors": "In attesa che i nostri tipsters diventino advisor...",
        "no_active": "Nessun tipster attivo al momento.",
        "be_first": "Sii il primo a creare una schedina!",
        "view_profile": "VEDI PROFILO",
        "current_balance": "Bilancio Attuale",
        "bet_plural": "{{count}} Schedine"
      },
      "matches": {
        "title": "Palinsesto",
        "loading": "Caricamento partite...",
        "no_matches": "Nessuna partita in programma per oggi.",
        "added": "Quota aggiunta alla schedina"
      },
      "home": {
        "hero_subtitle": "Seleziona le tue quote, costruisci la schedina e sfida gli altri tipster",
        "live_scores": "LIVESCORE IN TEMPO REALE",
        "popular_leagues": "LEAGUE POPOLARI",
        "search_placeholder": "Cerca squadra o campionato...",
        "all_leagues": "Tutti i campionati",
        "no_results": "Nessun match trovato per i filtri selezionati.",
        "load_error": "Errore nel caricamento dei match"
      },
      "common": {
        "loading": "Caricamento...",
        "error": "Errore",
        "success": "Successo"
      },
      "saved_bets": {
        "title": "Le tue schedine",
        "empty": "Nessuna schedina salvata",
        "back_to_matches": "Torna ai match",
        "settled": "PAGATA",
        "events": "EVENTI",
        "no_longer_available": "Scommessa non più disponibile",
        "share": "Condividi la tua schedina",
        "delete_confirm": "Sei sicuro di voler eliminare questa schedina?"
      },
      "rules": {
        "hero_badge": "Regolamento Ufficiale",
        "hero_title": "Tipsters Race",
        "hero_desc": "La gara che ti permette di dimostrare il tuo talento, farti conoscere e trasformare la tua passione in un'opportunità concreta.",
        "what_is_title": "Cos'è la Tipsters Race?",
        "what_is_p1": "La Tipsters Race è una competizione aperta a tutti gli appassionati di pronostici sportivi. L'obiettivo è semplice: accumula 10.000 punti grazie alle tue schedine azzeccate e diventa un Tipster Advisor riconosciuto dalla community.",
        "what_is_p2": "Condividi le tue idee con gli amici, sfidali nella classifica e dimostra quanto valgono davvero i tuoi pronostici — non solo al bar o sui social, ma in una piattaforma che premia il talento.",
        "how_it_works": "Come funziona",
        "revenue_title": "Il tuo guadagno",
        "revenue_desc": "Una volta diventato Advisor, potrai personalizzare la tua pagina e gestire i tuoi followers. Per ogni vendita o abbonamento effettuato sulla tua pagina, riceverai il 50% dei ricavi netti direttamente nel tuo Wallet in Euro.",
        "steps": {
          "register": { "title": "Registrati", "desc": "Crea il tuo account gratuito e inizia subito a giocare le tue schedine." },
          "play": { "title": "Gioca le tue schedine", "desc": "Condividi i tuoi pronostici con la community e accumula punti per ogni schedina azzeccata." },
          "points": { "title": "Raggiungi 10.000 punti", "desc": "Scala la classifica e raggiungi il traguardo per sbloccare lo status di Tipster Advisor." },
          "advisor": { "title": "Diventa Tipster Advisor", "desc": "Ottieni la tua pagina personale dove pubblicare schedine e vendere i tuoi consigli." },
          "audience": { "title": "Costruisci il tuo pubblico", "desc": "Più follower ti seguono, più opportunità hai di creare abbonamenti e monetizzare la tua esperienza." },
          "earn": { "title": "Guadagna", "desc": "Il 50% dei ricavi dai tuoi abbonamenti personali è tuo. Più azzecchi, più il tuo consiglio vale." }
        },
        "cta": "Inizia la scalata"
      },
      "error": {
        "404_title": "404",
        "404_message": "Ops! Pagina non trovata",
        "back_home": "Torna alla Home"
      },
      "auth": {
        "login_title": "Accedi a Tipsters Race",
        "email": "Email",
        "password": "Password",
        "login_btn": "Accedi",
        "logging_in": "In corso...",
        "login_error": "Errore di accesso",
        "invalid_creds": "Credenziali non valide",
        "conn_error": "Errore di connessione",
        "srv_error": "Impossibile collegarsi al server"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "regolamento": "Rules",
        "tipsters": "Tipsters",
        "my_bets": "My Bets",
        "wallet": "Wallet (€)",
        "betslip": "Betslip",
        "login": "Login",
        "logout": "Logout",
        "register": "Register",
        "home": "LIVESCORE & PREDICTIONS",
        "back_home": "Back to Home"
      },
      "betslip": {
        "title": "Betslip",
        "empty": "Your betslip is empty",
        "add_selection": "Click on an odd to add it",
        "clear": "Clear all",
        "stake": "GP Stake",
        "all": "All",
        "potential_win": "Potential Win",
        "confirm": "CONFIRM BET",
        "confirm_title": "Confirm your bet?",
        "confirm_desc": "Once confirmed, the bet cannot be cancelled or deleted. The amount of {{stake}} GP will be deducted from your balance.",
        "confirm_and_play": "Confirm and Play",
        "saving": "Saving...",
        "not_enough_gp": "You don't have enough GP Points!",
        "success": "Betslip saved successfully!",
        "total_odds": "Total Odds",
        "clear_confirm": "Are you sure you want to clear your betslip?",
        "cancel": "Cancel",
        "delete": "Delete"
      },
      "saved_bets": {
        "title": "Your bets",
        "empty": "No saved bets",
        "back_to_matches": "Back to matches",
        "settled": "PAID",
        "events": "EVENTS",
        "no_longer_available": "Bet no longer available",
        "share": "Share your bet",
        "delete_confirm": "Are you sure you want to delete this bet?"
      },
      "rules": {
        "hero_badge": "Official Rules",
        "hero_title": "Tipsters Race",
        "hero_desc": "The competition that allows you to demonstrate your talent, make yourself known and transform your passion into a concrete opportunity.",
        "what_is_title": "What is the Tipsters Race?",
        "what_is_p1": "The Tipsters Race is a competition open to all sports prediction enthusiasts. The goal is simple: accumulate 10,000 points thanks to your winning bets and become a Tipster Advisor recognized by the community.",
        "what_is_p2": "Share your ideas with friends, challenge them in the rankings and show what your predictions are really worth — not just at the bar or on social media, but on a platform that rewards talent.",
        "how_it_works": "How it works",
        "revenue_title": "Your earnings",
        "revenue_desc": "Once you become an Advisor, you can customize your page and manage your followers. For every sale or subscription made on your page, you will receive 50% of the net revenue directly into your Euro Wallet.",
        "steps": {
          "register": { "title": "Register", "desc": "Create your free account and start playing your bets immediately." },
          "play": { "title": "Play your bets", "desc": "Share your predictions with the community and accumulate points for each correct bet." },
          "points": { "title": "Reach 10,000 points", "desc": "Climb the rankings and reach the milestone to unlock Tipster Advisor status." },
          "advisor": { "title": "Become Tipster Advisor", "desc": "Get your personal page where you can publish bets and sell your advice." },
          "audience": { "title": "Build your audience", "desc": "The more followers follow you, the more opportunities you have to create subscriptions and monetize your experience." },
          "earn": { "title": "Earn", "desc": "50% of the revenue from your personal subscriptions is yours. The more you win, the more your advice is worth." }
        },
        "cta": "Start climbing"
      },
      "wallet": {
        "title": "My Wallet",
        "subtitle": "Earnings and withdrawals management",
        "balance": "Available Balance",
        "withdraw": "Request Withdrawal",
        "amount": "Amount (€)",
        "paypal_email": "PayPal Email",
        "withdraw_btn": "WITHDRAW NOW",
        "min_withdraw": "Minimum withdrawal is € 10.00",
        "insufficient": "Insufficient balance",
        "history": "Transaction History",
        "activity": "ACTIVITY",
        "sale": "Bet Sale",
        "withdrawal_req": "Withdrawal Request",
        "completed": "COMPLETED",
        "pending": "PENDING",
        "rejected": "REJECTED",
        "no_transactions": "No transactions",
        "tax_note": "Tax Note",
        "tax_desc": "Any tax charges are the responsibility of the receiver. Tipsters Race does not take commissions on your earnings."
      },
      "tipster": {
        "top_ten": "Top Ten Tipsters",
        "gp_ranking": "GP General Ranking",
        "full_ranking": "Full Ranking",
        "event_count": "{{count}} EVENTS",
        "total_odds": "Total Odds",
        "gp_win": "GP Win",
        "stake": "STAKE",
        "price": "Bet Price",
        "unlock": "UNLOCK NOW",
        "unlocked": "UNLOCKED",
        "expired": "EXPIRED",
        "no_bets": "No bets available",
        "follow_me": "FOLLOW ME",
        "advisor_badge": "CERTIFIED ADVISOR",
        "share_text": "Check out {{name}}'s winning bets on Tipsters Race!",
        "link_copied": "Link copied to clipboard!",
        "community_title": "Tipsters Community",
        "community_subtitle": "Discover the best experts and follow their bets.",
        "advisor_section": "Tipsters Advisor",
        "all_section": "All Tipsters",
        "waiting_advisors": "Waiting for our tipsters to become advisors...",
        "no_active": "No active tipsters at the moment.",
        "be_first": "Be the first to create a bet!",
        "view_profile": "VIEW PROFILE",
        "current_balance": "Current Balance",
        "bet_plural": "{{count}} Bets"
      },
      "matches": {
        "title": "Matches of the Day",
        "loading": "Loading matches...",
        "no_matches": "No matches scheduled for today.",
        "added": "Odds added to betslip"
      },
      "home": {
        "hero_subtitle": "Select your odds, build your betslip and challenge other tipsters",
        "live_scores": "REAL-TIME LIVESCORE",
        "popular_leagues": "POPULAR LEAGUES",
        "search_placeholder": "Search team or league...",
        "all_leagues": "All leagues",
        "no_results": "No matches found for the selected filters.",
        "load_error": "Error loading matches"
      },
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success"
      },
      "error": {
        "404_title": "404",
        "404_message": "Oops! Page not found",
        "back_home": "Return to Home"
      },
      "auth": {
        "login_title": "Login to Tipsters Race",
        "email": "Email",
        "password": "Password",
        "login_btn": "Login",
        "logging_in": "Logging in...",
        "login_error": "Login Error",
        "invalid_creds": "Invalid credentials",
        "conn_error": "Connection Error",
        "srv_error": "Unable to connect to server"
      }
    }
  },
  es: {
    translation: {
      "nav": {
        "regolamento": "Reglas",
        "tipsters": "Tipsters",
        "my_bets": "Mis Apuestas",
        "wallet": "Cartera (€)",
        "betslip": "Cupón",
        "login": "Acceso",
        "logout": "Cerrar sesión",
        "register": "Registro",
        "home": "RESULTADOS Y PRONÓSTICOS",
        "back_home": "Volver al inicio"
      },
      "betslip": {
        "title": "Cupón",
        "empty": "Tu cupón está vacío",
        "clear": "Vaciar todo",
        "stake": "Apuesta (GP)",
        "potential_win": "Ganancia Potencial",
        "confirm": "CONFIRMAR JUEGO",
        "saving": "Guardando...",
        "not_enough_gp": "¡No tienes suficientes puntos GP!",
        "success": "¡Cupón guardado con éxito!",
        "total_odds": "Cuota Total",
        "clear_confirm": "¿Estás seguro de que quieres vaciar el cupón?",
        "cancel": "Cancelar",
        "delete": "Eliminar"
      },
      "wallet": {
        "title": "Mi Cartera",
        "subtitle": "Gestión de ganancias y retiros",
        "balance": "Saldo Disponible",
        "withdraw": "Solicitar Retiro",
        "amount": "Monto (€)",
        "paypal_email": "Email PayPal",
        "withdraw_btn": "RETIRAR AHORA",
        "min_withdraw": "El monto mínimo de retiro es € 10.00",
        "insufficient": "Saldo insuficiente",
        "history": "Historial de Transacciones",
        "activity": "ACTIVIDAD",
        "sale": "Venta de Apuesta",
        "withdrawal_req": "Solicitud de Retiro",
        "completed": "COMPLETADO",
        "pending": "PENDIENTE",
        "rejected": "RECHAZADO",
        "no_transactions": "Sin transacciones",
        "tax_note": "Nota sobre Impuestos",
        "tax_desc": "Cualquier cargo fiscal es responsabilidad del receptor. Tipsters Race no cobra comisiones por tus ganancias."
      },
      "tipster": {
        "top_ten": "Top 10 Tipsters",
        "gp_ranking": "Clasificación General GP",
        "full_ranking": "Clasificación Completa",
        "event_count": "{{count}} EVENTOS",
        "total_odds": "Cuota Total",
        "gp_win": "GP Victoria",
        "stake": "APUESTA",
        "price": "Precio",
        "unlock": "DESBLOQUEAR",
        "unlocked": "DESBLOQUEADO",
        "expired": "EXPIRADO",
        "no_bets": "No hay apuestas disponibles",
        "follow_me": "SÍGUEME",
        "advisor_badge": "ASESOR CERTIFICADO",
        "share_text": "¡Mira las apuestas ganadoras de {{name}} en Tipsters Race!",
        "link_copied": "¡Enlace copiado al portapapeles!",
        "community_title": "Comunidad de Tipsters",
        "community_subtitle": "Descubre a los mejores expertos y sigue sus apuestas.",
        "advisor_section": "Asesores Tipster",
        "all_section": "Todos los Tipsters",
        "waiting_advisors": "Esperando que nuestros tipsters se conviertan en asesores...",
        "no_active": "No hay tipsters activos en este momento.",
        "be_first": "¡Sé el primero en crear una apuesta!",
        "view_profile": "VER PERFIL",
        "current_balance": "Saldo Actual",
        "bet_plural": "{{count}} Apuestas"
      },
      "matches": {
        "title": "Partidos del Día",
        "loading": "Cargando partidos...",
        "no_matches": "No hay partidos programados para hoy.",
        "added": "Cuota agregada al cupón"
      },
      "home": {
        "hero_subtitle": "Selecciona tus cuotas, construye tu cupón y desafía a otros tipsters",
        "live_scores": "RESULTADOS EN TIEMPO REAL",
        "popular_leagues": "LIGAS POPULARES",
        "search_placeholder": "Buscar equipo o liga...",
        "all_leagues": "Todas las ligas",
        "no_results": "No se encontraron partidos para los filtros seleccionados.",
        "load_error": "Error al cargar los partidos"
      },
      "common": {
        "loading": "Cargando...",
        "error": "Error",
        "success": "Éxito"
      },
      "betslip": {
        "title": "Boleto de apuestas",
        "empty": "Tu boleto de apuestas está vacío",
        "add_selection": "Haz clic en una cuota para añadirla",
        "clear": "Vaciar todo",
        "stake": "Puntaje GP",
        "all": "Todo",
        "potential_win": "Ganancia Potencial",
        "confirm": "CONFIRMAR APUESTA",
        "confirm_title": "¿Confirmar tu apuesta?",
        "confirm_desc": "Una vez confirmada, la apuesta no se puede cancelar ni eliminar. Se deducirá la cantidad de {{stake}} GP de tu saldo.",
        "confirm_and_play": "Confirmar y Jugar",
        "saving": "Guardando...",
        "not_enough_gp": "¡No tienes suficientes puntos GP!",
        "success": "¡Boleto guardado con éxito!",
        "total_odds": "Cuotas Totales",
        "clear_confirm": "¿Estás seguro de que quieres vaciar tu boleto?",
        "cancel": "Cancelar",
        "delete": "Eliminar"
      },
      "saved_bets": {
        "title": "Tus apuestas",
        "empty": "No hay apuestas guardadas",
        "back_to_matches": "Volver a los partidos",
        "settled": "PAGADA",
        "events": "EVENTOS",
        "no_longer_available": "Apuesta ya no disponible",
        "share": "Comparte tu apuesta",
        "delete_confirm": "¿Estás seguro de que quieres eliminar esta apuesta?"
      },
      "rules": {
        "hero_badge": "Reglamento Oficial",
        "hero_title": "Tipsters Race",
        "hero_desc": "La competencia que te permite demostrar tu talento, darte a conocer y transformar tu pasión en una oportunidad concreta.",
        "what_is_title": "¿Qué es la Tipsters Race?",
        "what_is_p1": "La Tipsters Race es una competición abierta a todos los entusiastas de las predicciones deportivas. El objetivo es sencillo: acumula 10.000 puntos gracias a tus apuestas ganadoras y conviértete en un Tipster Advisor reconocido por la comunidad.",
        "what_is_p2": "Comparte tus ideas con amigos, desafíalos en el ranking y demuestra cuánto valen realmente tus pronósticos — no solo en el bar o en las redes sociales, sino en una plataforma que premia el talento.",
        "how_it_works": "Cómo funciona",
        "revenue_title": "Tus ganancias",
        "revenue_desc": "Una vez que te conviertas en Advisor, podrás personalizar tu página y gestionar a tus seguidores. Por cada venta o suscripción realizada en tu página, recibirás el 50% de los ingresos netos directamente en tu Wallet en euros.",
        "steps": {
          "register": { "title": "Regístrate", "desc": "Crea tu cuenta gratuita y empieza a jugar tus apuestas inmediatamente." },
          "play": { "title": "Juega tus apuestas", "desc": "Comparte tus predicciones con la comunidad y acumula puntos por cada apuesta acertada." },
          "points": { "title": "Alcanza los 10.000 puntos", "desc": "Escala en el ranking y alcanza la meta para desbloquear el estatus de Tipster Advisor." },
          "advisor": { "title": "Conviértete en Tipster Advisor", "desc": "Obtén tu página personal donde publicar apuestas y vender tus consejos." },
          "audience": { "title": "Construye tu audiencia", "desc": "Cuantos más seguidores te sigan, más oportunidades tendrás de crear suscripciones y monetizar tu experiencia." },
          "earn": { "title": "Gana", "desc": "El 50% de los ingresos de tus suscripciones personales es tuyo. Cuanto más aciertes, más vale tu consejo." }
        },
        "cta": "Empieza la escalada"
      },
      "error": {
        "404_title": "404",
        "404_message": "¡Ops! Página no encontrada",
        "back_home": "Volver al inicio"
      },
      "auth": {
        "login_title": "Inicia sesión en Tipsters Race",
        "email": "Correo electrónico",
        "password": "Contraseña",
        "login_btn": "Iniciar sesión",
        "logging_in": "Iniciando sesión...",
        "login_error": "Error de inicio de sesión",
        "invalid_creds": "Credenciales no válidas",
        "conn_error": "Error de conexión",
        "srv_error": "No se puede conectar al servidor"
      }
    }
  },
  fr: {
    translation: {
      "nav": {
        "regolamento": "Règles",
        "tipsters": "Tipsters",
        "my_bets": "Mes Paris",
        "wallet": "Portefeuille (€)",
        "betslip": "Coupon",
        "login": "Connexion",
        "logout": "Déconnexion",
        "register": "S'inscrire",
        "home": "RÉSULTATS ET PRONOSTICS",
        "back_home": "Retour à l'accueil"
      },
      "betslip": {
        "title": "Coupon",
        "empty": "Votre coupon est vide",
        "clear": "Tout effacer",
        "stake": "Mise (GP)",
        "potential_win": "Gain Potentiel",
        "confirm": "CONFIRMER LE PARI",
        "saving": "Enregistrement...",
        "not_enough_gp": "Vous n'avez pas assez de points GP !",
        "success": "Coupon enregistré avec succès !",
        "total_odds": "Cote Totale",
        "clear_confirm": "Êtes-vous sûr de vouloir vider le coupon ?",
        "cancel": "Annuler",
        "delete": "Supprimer"
      },
      "wallet": {
        "title": "Mon Portefeuille",
        "subtitle": "Gestion des gains et retraits",
        "balance": "Solde Disponible",
        "withdraw": "Demander un Retrait",
        "amount": "Montant (€)",
        "paypal_email": "Email PayPal",
        "withdraw_btn": "RETIRER MAINTENANT",
        "min_withdraw": "Le montant minimum de retrait est de € 10.00",
        "insufficient": "Solde insuffisant",
        "history": "Historique des Transactions",
        "activity": "ACTIVITÉ",
        "sale": "Vente de Pari",
        "withdrawal_req": "Demande de Retrait",
        "completed": "TERMINÉ",
        "pending": "EN ATTENTE",
        "rejected": "REFUSÉ",
        "no_transactions": "Aucune transaction",
        "tax_note": "Note Fiscale",
        "tax_desc": "Toutes les charges fiscales sont à la charge du destinataire. Tipsters Race ne prend pas de commissions sur vos gains."
      },
      "tipster": {
        "top_ten": "Top 10 Tipsters",
        "gp_ranking": "Classement Général GP",
        "full_ranking": "Classement Complet",
        "event_count": "{{count}} ÉVÉNEMENTS",
        "total_odds": "Cote Totale",
        "gp_win": "GP Gain",
        "stake": "MISE",
        "price": "Prix du Pari",
        "unlock": "DÉBLOQUER",
        "unlocked": "DÉBLOQUÉ",
        "expired": "EXPIRÉ",
        "no_bets": "Aucun pari disponible",
        "follow_me": "SUIVEZ-MOI",
        "advisor_badge": "CONSEILLER CERTIFIÉ",
        "share_text": "Découvrez les paris gagnants de {{name}} sur Tipsters Race !",
        "link_copied": "Lien copié dans le presse-papiers !",
        "community_title": "Communauté de Tipsters",
        "community_subtitle": "Découvrez les meilleurs experts et suivez leurs paris.",
        "advisor_section": "Conseillers Tipster",
        "all_section": "Tous les Tipsters",
        "waiting_advisors": "En attendant que nos pronostiqueurs deviennent conseillers...",
        "no_active": "Aucun pronostiqueur actif pour le moment.",
        "be_first": "Soyez le premier à créer un pari !",
        "view_profile": "VOIR LE PROFIL",
        "current_balance": "Solde Actuel",
        "bet_plural": "{{count}} Paris"
      },
      "matches": {
        "title": "Matchs du Jour",
        "loading": "Chargement des matchs...",
        "no_matches": "Aucun match prévu pour aujourd'hui.",
        "added": "Cote ajoutée au coupon"
      },
      "home": {
        "hero_subtitle": "Sélectionnez vos cotes, créez votre coupon et défiez d'autres pronostiqueurs",
        "live_scores": "SCORES EN DIRECT",
        "popular_leagues": "LIGUES POPULAIRES",
        "search_placeholder": "Rechercher une équipe ou une ligue...",
        "all_leagues": "Toutes les ligues",
        "no_results": "Aucun match trouvé pour les filtres sélectionnés.",
        "load_error": "Erreur lors du chargement des matchs"
      },
      "common": {
        "loading": "Chargement...",
        "error": "Erreur",
        "success": "Succès"
      },
      "betslip": {
        "title": "Coupon de pari",
        "empty": "Votre coupon de pari est vide",
        "add_selection": "Cliquez sur une cote pour l'ajouter",
        "clear": "Tout vider",
        "stake": "Mise GP",
        "all": "Tous",
        "potential_win": "Gain Potentiel",
        "confirm": "CONFIRMER LE PARI",
        "confirm_title": "Confirmer votre pari ?",
        "confirm_desc": "Une fois confirmé, le pari ne peut être ni annulé ni supprimé. Le montant de {{stake}} GP sera déduit de votre solde.",
        "confirm_and_play": "Confirmer et Jouer",
        "saving": "Enregistrement...",
        "not_enough_gp": "Vous n'avez pas assez de points GP !",
        "success": "Coupon enregistré avec succès !",
        "total_odds": "Cote Totale",
        "clear_confirm": "Êtes-vous sûr de vouloir vider votre coupon ?",
        "cancel": "Annuler",
        "delete": "Supprimer"
      },
      "saved_bets": {
        "title": "Vos paris",
        "empty": "Aucun pari enregistré",
        "back_to_matches": "Retour aux matchs",
        "settled": "PAYÉ",
        "events": "ÉVÉNEMENTS",
        "no_longer_available": "Pari n'est plus disponible",
        "share": "Partager votre pari",
        "delete_confirm": "Êtes-vous sûr de vouloir supprimer ce pari ?"
      },
      "rules": {
        "hero_badge": "Règlement Officiel",
        "hero_title": "Tipsters Race",
        "hero_desc": "La compétition qui vous permet de démontrer votre talent, de vous faire connaître et de transformer votre passion en une opportunité concrète.",
        "what_is_title": "Qu'est-ce que la Tipsters Race ?",
        "what_is_p1": "La Tipsters Race est une compétition ouverte à tous les passionnés de pronostics sportifs. L'objectif est simple : accumulez 10 000 points grâce à vos paris gagnants et devenez un Tipster Advisor reconnu par la communauté.",
        "what_is_p2": "Partagez vos idées avec vos amis, défiez-les dans le classement et montrez ce que valent vraiment vos pronostics — pas seulement au bar ou sur les réseaux sociaux, mais sur une plateforme qui récompense le talent.",
        "how_it_works": "Comment ça marche",
        "revenue_title": "Vos gains",
        "revenue_desc": "Une fois devenu Advisor, vous pourrez personnaliser votre page et gérer vos followers. Pour chaque vente ou abonnement effectué sur votre page, vous recevrez 50 % des revenus nets directement dans votre Wallet en euros.",
        "steps": {
          "register": { "title": "S'inscrire", "desc": "Créez votre compte gratuit et commencez à jouer vos paris immédiatement." },
          "play": { "title": "Jouez vos paris", "desc": "Partagez vos pronostics avec la communauté et accumulez des points pour chaque pari correct." },
          "points": { "title": "Atteignez 10 000 points", "desc": "Grimpez dans le classement et atteignez l'étape pour débloquer le statut de Tipster Advisor." },
          "advisor": { "title": "Devenez Tipster Advisor", "desc": "Obtenez votre page personnelle où vous pouvez publier des paris et vendre vos conseils." },
          "audience": { "title": "Construisez votre audience", "desc": "Plus vous avez de followers, plus vous avez d'opportunités de créer des abonnements et de monétiser votre expérience." },
          "earn": { "title": "Gagnez", "desc": "50 % des revenus de vos abonnements personnels vous reviennent. Plus vous gagnez, plus vos conseils ont de la valeur." }
        },
        "cta": "Commencez l'ascension"
      },
      "error": {
        "404_title": "404",
        "404_message": "Oups ! Page non trouvée",
        "back_home": "Retour à l'accueil"
      },
      "auth": {
        "login_title": "Connexion à Tipsters Race",
        "email": "E-mail",
        "password": "Mot de passe",
        "login_btn": "Se connecter",
        "logging_in": "Connexion en cours...",
        "login_error": "Erreur de connexion",
        "invalid_creds": "Identifiants invalides",
        "conn_error": "Erreur de connexion",
        "srv_error": "Impossible de se connecter au serveur"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "it",
    supportedLngs: ["it", "en", "es", "fr"],
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export const getDateLocale = () => {
  const language = i18n.language ? i18n.language.split('-')[0] : 'it';
  switch (language) {
    case 'en': return enGB;
    case 'es': return es;
    case 'fr': return fr;
    default: return it;
  }
};

export default i18n;
