

# Daily Tipster Hub ⚽

App di scommesse calcio con tema scuro sportivo, carrello quote e condivisione schedina.

---

## 1. Layout e Tema Scuro Sportivo
- Header con logo "Daily Tipster Hub" e navigazione
- Tema scuro con sfondo nero/grigio scuro, accenti verdi/gialli per le quote
- Design responsive mobile-first (pensato per uso da smartphone)
- Footer con info e link utili

## 2. Lista Match con Quote
- Pagina principale con elenco partite di calcio (dati statici di esempio)
- Ogni match mostra: squadra casa vs trasferta, data/ora, campionato
- Quote 1X2 ben visibili come bottoni cliccabili
- Evidenziazione della quota selezionata
- Raggruppamento match per campionato (Serie A, Premier League, ecc.)

## 3. Carrello Scommesse (Betslip)
- Pannello laterale / drawer che si apre dal basso su mobile
- Mostra le selezioni aggiunte con possibilità di rimuoverle
- Calcolo automatico della quota totale (moltiplicazione di tutte le quote)
- Campo per inserire l'importo della puntata
- Calcolo della potenziale vincita in tempo reale
- Pulsante "Conferma scommessa"

## 4. Backend con Supabase (Lovable Cloud)
- Autenticazione utenti (registrazione/login)
- Tabella per salvare le scommesse piazzate con le selezioni
- Storico scommesse dell'utente con dettagli e stato
- Pagina profilo utente con riepilogo scommesse

## 5. Condivisione Schedina
- Dopo aver confermato una scommessa, possibilità di generare un'immagine/card della schedina
- Pulsante "Condividi" per copiare link o scaricare immagine della schedina
- La schedina condivisa mostra: match, quote selezionate, quota totale e potenziale vincita

## 6. Pagine dell'App
- **Home**: Lista match con quote e filtri per campionato
- **Login/Registrazione**: Autenticazione utente
- **Le mie scommesse**: Storico schedine piazzate
- **Dettaglio schedina**: Riepilogo di una singola scommessa con opzione condivisione

