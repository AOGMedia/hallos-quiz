import React, { useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { useMediaQuery } from "@react-hook/media-query";
import { Zap, Wallet, ArrowRightLeft, Trophy, Info } from "lucide-react";

interface GuidePage {
  image?: string;
  text: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface ComponentProps {
  pages: GuidePage[];
}

export const MorganGuideBook = ({ pages }: ComponentProps) => {
  const book = useRef<any>(null);

  // Breakpoints
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 640px)");

  // Dynamic dimensions - strictly optimized for the 50/50 grid layout
  const width = isDesktop ? 240 : isTablet ? 300 : 260;
  const height = isDesktop ? 550 : isTablet ? 560 : 500;
  const usePortrait = !isDesktop; // Use double-page only when we have enough grid width

  const handleFlip = (pageNum: number) => {
    if (book.current) {
      book.current.pageFlip().flip(pageNum);
    }
  };

  return (
    <div className="w-full flex justify-center items-center py-2 sm:py-4 px-2 sm:px-0 overflow-hidden">
      <HTMLFlipBook
        key={usePortrait ? "portrait" : "landscape"}
        ref={book}
        width={width}
        height={height}
        showCover={true}
        usePortrait={usePortrait}
        className="shadow-2xl shadow-black/50"
        style={{}}
        startPage={0}
        size={"fixed"}
        minWidth={250}
        maxWidth={800}
        minHeight={400}
        maxHeight={1000}
        drawShadow={true}
        flippingTime={1000}
        startZIndex={0}
        autoSize={false}
        maxShadowOpacity={0.5}
        mobileScrollSupport={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
      >
        {/* Cover Page */}
        <div className="relative bg-[#0a0a0a] border-l-4 border-accent rounded-r-lg p-6 sm:p-8 text-white flex flex-col items-center justify-center shadow-2xl cursor-grab h-full overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_70%)] opacity-30" />
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mb-4 backdrop-blur-sm">
            {/* <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-accent" /> */}
            <img src="/icon.png" alt="Icon" className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-center mb-1 tracking-tighter">
            MORGAN <span className="text-accent">GUIDE</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-accent font-bold uppercase tracking-[0.2em] mb-6">
            Master the Currency ,etc.
          </p>

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mb-6"></div>

          <div className="text-center space-y-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground block">
              Learn how to buy, convert, and win
            </span>
            <div className="mt-4">
              <span className="text-[10px] text-accent/60 font-bold tracking-widest">
                FLIP TO START →
              </span>
            </div>
          </div>
        </div>

        {/* Index Page */}
        <div className="w-full flex flex-col bg-zinc-900 border border-border p-6 sm:p-8 text-white shadow-inner h-full overflow-hidden">
          <div className="text-accent font-bold text-base mb-4 border-b border-accent/20 pb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> INDEX
          </div>

          <div className="flex-1">
            <ol className="space-y-3">
              {pages.map((page, index) => (
                <li
                  key={index}
                  onClick={() => handleFlip(index + 2)}
                  className="group flex justify-between items-center cursor-pointer hover:bg-accent/5 p-2 rounded-lg transition-colors border border-transparent hover:border-accent/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent group-hover:bg-accent group-hover:text-black transition-colors">
                      {index + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                      {page.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity capitalize">
                    Read →
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-auto p-3 bg-accent/5 rounded-xl border border-accent/10">
            <p className="text-[9px] sm:text-[10px] leading-relaxed text-muted-foreground italic">
              "MP is the lifeblood of the Hallos Arena. Use it wisely to climb
              the leaderboard."
            </p>
          </div>
        </div>

        {/* Dynamic Pages */}
        {pages.map((page, index) => (
          <div
            key={index}
            className="w-full  flex flex-col bg-[#111] border border-border p-6 sm:p-8 text-white relative shadow-inner overflow-hidden cursor-grab h-full"
          >
            <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-accent/40 font-bold">
              PAGE {index + 2}
            </div>

            <div className="flex justify-center items-center mt-2 sm:mt-4 mb-2 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
                <div className="relative scale-90">{page.icon}</div>
              </div>
            </div>

            <div className="text-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight line-clamp-1">
                {page.title}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-accent font-bold uppercase tracking-widest">
                {page.subtitle}
              </p>
            </div>

            <div className="flex-1 py-1 sm:py-2">
              <div className="bg-zinc-800/50 rounded-2xl p-3 sm:p-4 border border-white/5 shadow-xl min-h-[180px]">
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-medium whitespace-pre-line">
                  {page.text}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2 flex justify-between items-center text-[8px] sm:text-[9px] uppercase tracking-tighter font-bold text-accent/40">
              <span>Hallos Quiz v1.0</span>
              <span>Official Rulebook</span>
            </div>
          </div>
        ))}

        {/* Back Cover */}
        <div className="bg-[#0a0a0a] border-r-4 border-accent p-8 text-white flex flex-col items-center justify-center h-full overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tighter">
            GOOD LUCK!
          </h1>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Fortune favors the swift and the sharp-minded.
          </p>
          <div className="mt-12 opacity-30">
            <div className="text-[10px] font-bold tracking-[0.5em] text-accent">
              HALLOS ARENA
            </div>
          </div>
        </div>
      </HTMLFlipBook>
    </div>
  );
};
