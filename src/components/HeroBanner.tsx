import heroBg from "@/assets/hero-bg.jpg";
import { useTranslation } from "react-i18next";

export function HeroBanner() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Football stadium at night"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>
      <div className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-primary drop-shadow-[0_2px_12px_hsl(43,90%,50%,0.4)]">
          Tipsters Race
        </h1>
        <p className="mt-3 text-sm sm:text-base text-foreground/70 max-w-md">
          {t('home.hero_subtitle')}
        </p>
      </div>
    </section>
  );
}
