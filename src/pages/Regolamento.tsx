import { Header } from "@/components/Header";
import { Betslip } from "@/components/Betslip";
import { Trophy, Target, Users, Star, Rocket, BadgeDollarSign, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Regolamento() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Rocket,
      title: t('rules.steps.register.title'),
      desc: t('rules.steps.register.desc'),
    },
    {
      icon: Target,
      title: t('rules.steps.play.title'),
      desc: t('rules.steps.play.desc'),
    },
    {
      icon: Trophy,
      title: t('rules.steps.points.title'),
      desc: t('rules.steps.points.desc'),
    },
    {
      icon: Star,
      title: t('rules.steps.advisor.title'),
      desc: t('rules.steps.advisor.desc'),
    },
    {
      icon: Users,
      title: t('rules.steps.audience.title'),
      desc: t('rules.steps.audience.desc'),
    },
    {
      icon: BadgeDollarSign,
      title: t('rules.steps.earn.title'),
      desc: t('rules.steps.earn.desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Betslip />

      <main className="container py-8 space-y-10 max-w-3xl">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Trophy className="h-4 w-4" /> {t('rules.hero_badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('rules.hero_title')}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            {t('rules.hero_desc')}
          </p>
        </section>

        {/* What is it */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">{t('rules.what_is_title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('rules.what_is_p1')}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t('rules.what_is_p2')}
          </p>
        </section>

        {/* Steps */}
        <section className="space-y-5">
          <h2 className="text-xl font-bold text-primary">{t('rules.how_it_works')}</h2>
          <div className="grid gap-4">
            {steps.map((step, i) => (
              <Card key={i} className="border-border/60 bg-card/80">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <step.icon className="h-4 w-4 text-primary" />
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Revenue */}
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" /> {t('rules.revenue_title')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('rules.revenue_desc')}
          </p>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-8">
          <a
            href="https://tipstersrace.com/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('nav.register')} <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>
    </div>
  );
}
