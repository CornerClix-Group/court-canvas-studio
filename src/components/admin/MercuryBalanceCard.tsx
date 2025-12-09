import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Building2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MercuryAccount {
  id: string;
  name: string;
  currentBalance: number;
  availableBalance: number;
  type: string;
}

export function MercuryBalanceCard() {
  const [accounts, setAccounts] = useState<MercuryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("mercury-sync", {
        body: { action: "get-accounts" },
      });

      if (error) throw error;
      setAccounts(data.accounts || []);
    } catch (err: any) {
      console.error("Error fetching Mercury accounts:", err);
      setError(err.message || "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const syncTransactions = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercury-sync", {
        body: { action: "sync-transactions" },
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Synced ${data.transactions} transactions, matched ${data.matched} payments.`,
      });
    } catch (err: any) {
      console.error("Error syncing transactions:", err);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err.message || "Failed to sync transactions",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Mercury Bank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Mercury Bank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccounts}
            className="mt-3"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sky-500/20 bg-sky-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-sky-600" />
            Mercury Bank
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncTransactions}
            disabled={syncing}
            className="h-8"
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Balance
            </p>
            <p className="text-2xl font-bold text-sky-600">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          {accounts.length > 1 && (
            <div className="space-y-2 pt-2 border-t">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{account.name}</span>
                  <span className="font-medium">
                    {formatCurrency(account.currentBalance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
