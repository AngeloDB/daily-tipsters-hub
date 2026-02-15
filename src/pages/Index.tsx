import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { MatchList } from "@/components/MatchList";
import { Betslip } from "@/components/Betslip";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <HeroBanner />
      <main className="container flex-1 py-6">
        <MatchList />
      </main>
      <Betslip />
    </div>
  );
};

export default Index;
