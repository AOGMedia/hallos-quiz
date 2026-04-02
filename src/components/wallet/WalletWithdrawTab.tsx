import { useState, useMemo } from "react";
import { Zap, ArrowUpRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_WITHDRAW } from "@/data/walletData";
import { useWithdrawChuta } from "@/hooks/useChutaWallet";
import type { ChutaCurrency } from "@/lib/api/chutaWallet";

const FEE_RATE = 0.1; // 10%
const USD_TO_NGN = 1400;

interface WalletWithdrawTabProps {
  balance: number;
}

const WalletWithdrawTab = ({ balance }: WalletWithdrawTabProps) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<ChutaCurrency>("NGN");
  const { mutate, isPending, isSuccess, isError, error, reset } = useWithdrawChuta();

  const num = parseFloat(amount) || 0;
  const isValid = num >= MIN_WITHDRAW && num <= balance;
  const showError = amount !== "" && !isValid;

  // Live fee breakdown
  const breakdown = useMemo(() => {
    if (!num) return null;
    const fee = Math.floor(num * FEE_RATE);
    const net = num - fee;
    const usd = net / 100;
    const payout = currency === "NGN" ? usd * USD_TO_NGN : usd;
    return { fee, net, payout };
  }, [num, currency]);

  const handleWithdraw = () => {
    if (!isValid) return;
    reset();
    mutate({ chutaAmount: num, currency });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs sm:text-sm text-muted-foreground">
        Transfer Morgan Points back to your platform wallet. 10% fee applies. Minimum {MIN_WITHDRAW.toLocaleString()} MP.
      </p>

      {/* Available balance */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <span className="text-xs sm:text-sm text-muted-foreground">Available balance</span>
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-sm sm:text-base font-bold text-foreground">
            {balance.toLocaleString()} MP
          </span>
        </div>
      </div>

      {/* Feedback */}
      {isSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Withdrawal successful! Funds sent to your platform wallet.
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {(error as Error).message}
        </div>
      )}

      {/* Currency selector */}
      <div>
        <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
          Receive in
        </label>
        <div className="flex gap-2">
          {(["NGN", "USD"] as ChutaCurrency[]).map((c) => (
            <button
              key={c}
              onClick={() => { setCurrency(c); reset(); }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                currency === c
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
          Amount to withdraw (MP)
        </label>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warning pointer-events-none" />
          <Input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); reset(); }}
            placeholder={`Min ${MIN_WITHDRAW.toLocaleString()}`}
            className="bg-card border-border pl-9 text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
          />
        </div>
        {showError && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {num < MIN_WITHDRAW
              ? `Minimum withdrawal is ${MIN_WITHDRAW.toLocaleString()} MP`
              : "Amount exceeds available balance"}
          </p>
        )}
      </div>

      {/* Live fee breakdown */}
      {breakdown && isValid && (
        <div className="p-3 sm:p-4 bg-card border border-border rounded-xl space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>MP amount</span>
            <span>{num.toLocaleString()} MP</span>
          </div>
          <div className="flex justify-between text-red-400">
            <span>10% fee</span>
            <span>-{breakdown.fee.toLocaleString()} MP</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Net MP</span>
            <span>{breakdown.net.toLocaleString()} MP</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
            <span>You receive</span>
            <span>
              {currency === "NGN"
                ? `₦${breakdown.payout.toLocaleString()}`
                : `$${breakdown.payout.toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

      <Button
        onClick={handleWithdraw}
        disabled={!isValid || isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-3 sm:py-4 disabled:opacity-40"
      >
        <ArrowUpRight className="w-4 h-4 mr-2" />
        {isPending ? "Processing..." : isValid ? `Withdraw ${num.toLocaleString()} MP` : "Withdraw MP"}
      </Button>
    </div>
  );
};

export default WalletWithdrawTab;
