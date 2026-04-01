import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ShareResultModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  playerScore: number;
  isVictory?: boolean | null;
}

const ShareResultModal = ({
  isOpen,
  onOpenChange,
  playerScore,
  isVictory,
}: ShareResultModalProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const shareUrl = "https://www.hallos.net/dashboard/games";
  const shareTitle = "Play Hallos Quiz!";
  const shareText =
    isVictory === true
      ? `🏆 I just won a match on Hallos Quiz with a score of ${playerScore}! 🔥 Can you beat my score?`
      : isVictory === false
      ? `🎮 I just played a match on Hallos Quiz and scored ${playerScore}. 🚀 Think you can do better?`
      : `🌟 I just scored ${playerScore} on Hallos Quiz! 🎯 Come play with me!`;

  const handleNativeShare = async () => {
    if (!bannerRef.current) return;
    try {
      setIsGenerating(true);
      toast.loading("Generating beautiful banner...", { id: "share-banner" });
      
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2,
        backgroundColor: "#09090b", // default dark theme bg for good contrast fallback
        useCORS: true,
      });
      
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) throw new Error("Failed to create image");
      
      const file = new File([blob], "hallos-quiz-score.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        toast.success("Shared successfully!", { id: "share-banner" });
      } else {
        // Fallback: Download the image
        const link = document.createElement("a");
        link.download = "hallos-quiz-score.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Banner downloaded! You can now attach it to your posts.", { id: "share-banner" });
      }
    } catch (err) {
      console.error("Error sharing image:", err);
      toast.error("Failed to generate or share the banner image.", { id: "share-banner" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setIsCopied(true);
      toast.success("Result copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${shareUrl}`
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}&quote=${encodeURIComponent(shareText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95%] bg-card/95 backdrop-blur-md border-border/50 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
            <Share2 className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            Share Your Score!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm max-w-sm mx-auto">
            Let your friends know how you performed and challenge them to beat your score.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Beautiful Banner Preview */}
          <div 
            ref={bannerRef}
            className="relative w-full max-w-[400px] mx-auto overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1040] via-[#0f0826] to-[#090514] border border-primary/30 p-8 sm:p-10 flex flex-col items-center justify-center gap-4 sm:gap-6 group shadow-xl"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-[64px]" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/20 rounded-full blur-[64px]" />
            
            <div className="relative z-10 text-center flex flex-col items-center justify-center space-y-3 sm:space-y-4">
              <h3 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/70 font-bold">Hallos Quiz Match</h3>
              
              <div className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg leading-none flex items-baseline gap-2">
                {playerScore} <span className="text-xl sm:text-2xl text-white/60 font-bold uppercase tracking-widest">PTS</span>
              </div>
              
              <div className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg mt-4">
                <span className="text-sm font-bold text-white tracking-wide">
                  {isVictory === true ? "🏆 CHALLENGE WINNER!" : isVictory === false ? "💪 VALIANT EFFORT!" : "🎯 MATCH COMPLETED!"}
                </span>
              </div>

              <div className="pt-4 mt-2 border-t border-white/10 w-full">
                <p className="text-[10px] text-white/50 tracking-widest font-medium uppercase">Play at hallos.net/dashboard/games</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* WhatsApp */}
            <Button variant="outline" className="w-full flex items-center gap-2 bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 hover:scale-[1.02] transition-all" asChild>
              <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer"><WhatsappIcon className="w-4 h-4" /> WhatsApp</a>
            </Button>

            {/* Twitter/X */}
            <Button variant="outline" className="w-full flex items-center gap-2 bg-foreground/5 border-foreground/10 text-foreground hover:bg-foreground/10 hover:scale-[1.02] transition-all" asChild>
              <a href={shareLinks.twitter} target="_blank" rel="noreferrer"><XIcon className="w-4 h-4" /> X (Twitter)</a>
            </Button>

            {/* Facebook */}
            <Button variant="outline" className="w-full flex items-center gap-2 bg-[#1877F2]/10 border-[#1877F2]/20 text-[#1877F2] hover:bg-[#1877F2]/20 hover:scale-[1.02] transition-all" asChild>
              <a href={shareLinks.facebook} target="_blank" rel="noreferrer"><FacebookIcon className="w-4 h-4" /> Facebook</a>
            </Button>

            {/* Telegram */}
            <Button variant="outline" className="w-full flex items-center gap-2 bg-[#229ED9]/10 border-[#229ED9]/20 text-[#229ED9] hover:bg-[#229ED9]/20 hover:scale-[1.02] transition-all" asChild>
              <a href={shareLinks.telegram} target="_blank" rel="noreferrer"><TelegramIcon className="w-4 h-4" /> Telegram</a>
            </Button>

            {/* LinkedIn */}
            <Button variant="outline" className="w-full flex items-center gap-2 bg-[#0077b5]/10 border-[#0077b5]/20 text-[#0077b5] hover:bg-[#0077b5]/20 hover:scale-[1.02] transition-all" asChild>
              <a href={shareLinks.linkedin} target="_blank" rel="noreferrer"><LinkedInIcon className="w-4 h-4" /> LinkedIn</a>
            </Button>

            {/* Instagram - Uses Native Share Flow */}
            <Button variant="outline" className="w-full flex items-center gap-2 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] bg-opacity-10 border-[#e1306c]/20 text-[#e1306c] hover:opacity-80 hover:scale-[1.02] transition-all relative overflow-hidden group" onClick={handleNativeShare} disabled={isGenerating}>
              <div className="absolute inset-0 bg-white/90 z-0 group-hover:bg-white/80 transition-colors" />
              <div className="relative z-10 flex items-center gap-2">
                <InstagramIcon className="w-4 h-4" /> Instagram
              </div>
            </Button>
            
            {/* Copy Link - Col Span 2 */}
            <Button variant="outline" className="col-span-2 w-full flex items-center gap-2 hover:bg-primary/5 hover:text-primary hover:scale-[1.01] transition-all" onClick={handleCopy}>
              <Copy className="w-4 h-4" /> {isCopied ? "Copied & Ready!" : "Copy Link to Share Anywhere"}
            </Button>
          </div>

          <div className="mt-2 text-center">
            <Button variant="default" className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:to-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]" onClick={handleNativeShare} disabled={isGenerating}>
              <ImageIcon className="w-4 h-4" /> {isGenerating ? "Generating Preview..." : "Share Image Banner to Socials"}
            </Button>
          </div>
        </div>


      </DialogContent>
    </Dialog>
    
  );
};

export default ShareResultModal;

// Custom Social Icons
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a11.968 11.968 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
