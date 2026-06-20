import { Unlink, ArrowRight } from "lucide-react";

const CampaignInvalidLink = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 overflow-hidden">
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-destructive/6 rounded-full blur-[100px] pointer-events-none" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[180px] bg-destructive/10 rounded-full blur-[50px] pointer-events-none" />

    <div className="relative flex flex-col items-center text-center w-full max-w-xs animate-fade-in">
      <div className="relative mb-1 select-none">
        <span className="absolute -top-3 left-6 w-1 h-1 rounded-full bg-destructive/30" />
        <span className="absolute -top-5 right-10 w-1.5 h-1.5 rounded-full bg-destructive/20" />
        <span className="absolute top-4 -left-4 w-1 h-1 rounded-full bg-destructive/25" />
        <span className="absolute top-6 -right-3 w-1 h-1 rounded-full bg-destructive/20" />
        <p
          className="text-[108px] sm:text-[128px] font-black leading-none tracking-tighter text-destructive"
          style={{ textShadow: "0 0 80px hsl(var(--destructive) / 0.35), 0 0 20px hsl(var(--destructive) / 0.2)" }}
        >
          404
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="h-px w-10 bg-destructive/20" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 ">
          <Unlink className="w-3 h-3 text-destructive" strokeWidth={2} />
          <span className="text-[10px] font-mono font-semibold text-destructive tracking-widest uppercase">
            Invalid Link
          </span>
        </div>
        <div className="h-px w-10 bg-destructive/20" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">
        Looks like you're lost
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        This quiz link is invalid or has already been used.
      </p>

      <div className="flex items-center gap-3 w-full mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground/30 select-none tracking-widest">✦</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <p className="text-xs text-muted-foreground/50 leading-relaxed mb-7">
        Each quiz link is unique and can only be used once.
        <br />
        Check your email for the original link.
      </p>

      <a
        href="https://www.hallos.net/dashboard/games"
        className="group w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-all duration-200 shadow-lg shadow-destructive/20"
      >
        Go to Hallos
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
      </a>
    </div>
  </div>
);

export default CampaignInvalidLink;
