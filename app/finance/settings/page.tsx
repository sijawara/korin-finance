"use client";

import { useState, useEffect } from "react";
import { H1, H3, P } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import useCurrency, { CurrencyCode } from "@/hooks/useCurrency";

export default function SettingsPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("IDR");
  const [savedCurrency, setSavedCurrency] = useState<CurrencyCode>("IDR");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, getIdToken } = useAuth();
  const { currencies, formatWithSymbol } = useCurrency();

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const token = await getIdToken();

        const response = await fetch("/api/settings", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        const data = await response.json();

        if (data.success && data.data) {
          setSelectedCurrency((data.data.currency as CurrencyCode) || "IDR");
          setSavedCurrency((data.data.currency as CurrencyCode) || "IDR");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user, getIdToken]);

  const handleSaveSettings = async () => {
    if (!user) {
      toast.error("You must be logged in to save settings");
      return;
    }

    setIsSaving(true);

    try {
      const token = await getIdToken();

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();

      if (data.success) {
        setSavedCurrency(selectedCurrency);
        toast.success("Settings saved successfully");
      } else {
        throw new Error(data.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrencyDetails = (code: CurrencyCode) => {
    return currencies.find((c) => c.code === code) || currencies[0];
  };

  const hasChanges = selectedCurrency !== savedCurrency;

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <H1>Settings</H1>
            <P className="text-muted-foreground">Loading your settings...</P>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <H1>Settings</H1>
          <P className="text-muted-foreground">
            Manage your application preferences and account settings
          </P>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? "Saving..." : "Save Changes"}
          <Save className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Preferences</CardTitle>
            <CardDescription>
              Set your preferred currency for transactions and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) =>
                    setSelectedCurrency(value as CurrencyCode)
                  }
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {currency.name} ({currency.symbol})
                          </span>
                          {currency.code === savedCurrency && (
                            <Check className="h-4 w-4 text-green-500 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <P className="text-sm text-muted-foreground mt-2">
                  Current display: {formatWithSymbol(1234.56)}
                </P>
              </div>

              <div className="space-y-2">
                <H3 className="text-base font-medium">Currency Information</H3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code:</span>
                      <span className="font-medium">
                        {getCurrencyDetails(selectedCurrency).code}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {getCurrencyDetails(selectedCurrency).name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Symbol:</span>
                      <span className="font-medium">
                        {getCurrencyDetails(selectedCurrency).symbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
