import "./globals.css";
import Nav from "../components/Nav";
import Shell from "../components/Shell";
import { LanguageProvider } from "../components/LanguageProvider";
import { CurrencyProvider } from "../components/CurrencyProvider";
import { PopupProvider } from "../components/PopupProvider";
import VisitTracker from "../components/VisitTracker";

export const metadata = {
  title: "Madagascar Tour — Voyages et circuits à Madagascar",
};

export const viewport = {
  themeColor: "#063d2a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          <CurrencyProvider>
            <PopupProvider>
              <VisitTracker />
              <Nav />
              <Shell>{children}</Shell>
            </PopupProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
