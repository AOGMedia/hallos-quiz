import { useState, useMemo } from "react";
import { Zap, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { purchasePackages, CP_TO_NGN } from "@/data/walletData";
import { usePurchaseChuta } from "@/hooks/useChutaWallet";

const MIN_CP = 100;

const WalletPurchaseTab = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customCp, setCustomCp] = useState("");
  const { mutate, isPending, isSuccess, isError, error, reset } = usePurchaseChuta();

  // Effective CP: preset takes priority, else custom input
  const effectiveCp = useMemo(() => {
    if (selectedId) {
      return purchasePackages.find((p) => p.id === selectedId)?.cp ?? 0;
    }
    return parseFloat(customCp) || 0;
  }, [selectedId, customCp]);

  const ngnCost = Math.ceil(effectiveCp * CP_TO_NGN);
  const isValid = effectiveCp >= MIN_CP;

  const handlePresetClick = (id: string) => {
    setSelectedId(id);
    setCustomCp("");
    reset();
  };

  const handleCustomChange = (val: string) => {
    setSelectedId(null);
    setCustomCp(val);
    reset();
  };

  const handleBuy = () => {
    if (!isValid) return;
    reset();
    mutate({ amount: ngnCost, currency: "NGN" });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <p className="text-xs sm:text-sm text-muted-foreground">
        Transfer from your Hallos wallet instantly.
      </p>

      {/* Conversion note */}
      <div className="px-3 py-2 bg-card border border-border rounded-lg text-xs text-muted-foreground">
        <span className="text-foreground font-medium">Rate: </span>
        1 MP = ₦{CP_TO_NGN} &nbsp;·&nbsp; e.g. 100 MP = ₦{(100 * CP_TO_NGN).toLocaleString()}
      </div>

      {/* Feedback */}
      {isSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Purchase successful! Your balance has been updated.
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {(error as Error).message}
        </div>
      )}

      {/* Preset chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick select</p>
        <div className="flex flex-wrap gap-2">
          {purchasePackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePresetClick(pkg.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                selectedId === pkg.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Zap className="w-3 h-3 text-warning" />
              {pkg.cp.toLocaleString()} MP
              {pkg.bonus && (
                <span className="ml-1 text-[10px] text-accent">{pkg.bonus}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom CP input */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">
          Or enter custom amount (min {MIN_CP} MP)
        </label>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warning pointer-events-none" />
          <Input
            type="number"
            value={customCp}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={`e.g. 500`}
            min={MIN_CP}
            className="bg-card border-border pl-9 text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>
      </div>

      {/* Cost preview */}
      {isValid && (
        <div className="flex items-center justify-between px-3 py-2.5 bg-card border border-border rounded-lg text-xs sm:text-sm">
          <span className="text-muted-foreground">You pay</span>
          <span className="font-semibold text-foreground">
            ₦{ngnCost.toLocaleString()} → ~{effectiveCp.toLocaleString()} MP
          </span>
        </div>
      )}

      <Button
        onClick={handleBuy}
        disabled={!isValid || isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-3 disabled:opacity-40"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {isPending
          ? "Processing..."
          : isValid
          ? `Buy ${effectiveCp.toLocaleString()} MP for ₦${ngnCost.toLocaleString()}`
          : `Enter at least ${MIN_CP} MP`}
      </Button>
    </div>
  );
};

export default WalletPurchaseTab;
