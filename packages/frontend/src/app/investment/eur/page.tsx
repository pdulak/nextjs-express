"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NBP_EUR_API = "https://api.nbp.pl/api/exchangerates/rates/a/eur";

async function getExchangeRate(
    date: string
): Promise<{ rate: number; debugInfo: string[]; date: string; tableNo: string }> {
    const debugInfo: string[] = [];
    let currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1);
    let attempts = 0;

    while (attempts < 10) {
        const formattedDate = currentDate.toISOString().split("T")[0];
        debugInfo.push(`Attempt ${attempts + 1}: Checking rate for ${formattedDate}`);

        try {
            const res = await fetch(
                `${NBP_EUR_API}/${formattedDate}/?format=json`
            );
            if (res.ok) {
                const data = (await res.json()) as {
                    rates: Array<{ mid: number; no: string }>;
                };
                const rate = data.rates[0].mid;
                const tableNo = data.rates[0].no;
                debugInfo.push(`✓ Rate found: 1 EUR = ${rate} PLN`);
                return { rate, debugInfo, date: formattedDate, tableNo };
            }
        } catch {
            debugInfo.push(`✗ No rate available for ${formattedDate}`);
        }
        currentDate.setDate(currentDate.getDate() - 1);
        attempts++;
    }
    throw new Error("Could not find exchange rate within last 10 days");
}

function formatComment(
    investmentDate: string,
    rateDate: string,
    eurValue: number,
    rate: number,
    tableNo: string
): string {
    const plnValue = (eurValue * rate).toFixed(2);
    const [tableNumber, , , year] = tableNo.split("/");
    const tableUrl = `https://nbp.pl/archiwum-kursow/tabela-nr-${tableNumber}-a-nbp-${year}-z-dnia-${rateDate}/`;
    return `${investmentDate} - ${eurValue} EUR zysku x ${rate.toFixed(4)} (${tableUrl}) = ${plnValue} zł`;
}

export default function InvestmentPage() {
    const [value, setValue] = useState("");
    const [date, setDate] = useState("");
    const [plnValue, setPlnValue] = useState<string | null>(null);
    const [comment, setComment] = useState<string | null>(null);
    const [debugLines, setDebugLines] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        setDate(new Date().toISOString().split("T")[0]);
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setPlnValue(null);
        setComment(null);
        setDebugLines([]);
        setLoading(true);

        const eurValue = parseFloat(value);
        const investmentDate = date;

        if (Number.isNaN(eurValue) || eurValue <= 0) {
            setError("Enter a valid EUR value.");
            setLoading(false);
            return;
        }

        try {
            const lines: string[] = [
                `Note: Using rate from previous business day for investment on ${investmentDate}`,
                "",
            ];
            setDebugLines(lines);

            const { rate, debugInfo, date: rateDate, tableNo } =
                await getExchangeRate(investmentDate);
            const allDebug = [...lines, ...debugInfo];
            setDebugLines(allDebug);

            const pln = eurValue * rate;
            allDebug.push(
                "",
                `Final: ${eurValue} EUR × ${rate} PLN = ${pln.toFixed(2)} PLN`
            );
            setDebugLines(allDebug);

            setPlnValue(pln.toFixed(2));
            setComment(
                formatComment(investmentDate, rateDate, eurValue, rate, tableNo)
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Calculation failed.";
            setError(msg);
            setDebugLines((prev) => [...prev, "", `Error: ${msg}`]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Investment Dashboard</h1>

            <Card className="max-w-6xl">
                <CardHeader>
                    <CardTitle>EUR Investment Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="eur-value">Value in EUR</Label>
                            <Input
                                id="eur-value"
                                data-testid="eur-value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="investment-date">Date of Investment</Label>
                            <Input
                                id="investment-date"
                                data-testid="investment-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        {plnValue !== null && (
                            <div className="space-y-2">
                                <Label htmlFor="pln-value">Value in PLN</Label>
                                <Input
                                    id="pln-value"
                                    data-testid="pln-value"
                                    type="text"
                                    value={plnValue}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                        )}
                        {comment !== null && (
                            <div className="space-y-2">
                                <Label htmlFor="comment">Comment</Label>
                                <Input
                                    id="comment"
                                    data-testid="comment"
                                    type="text"
                                    value={comment}
                                    readOnly
                                    className="bg-muted font-mono text-sm"
                                />
                            </div>
                        )}
                        {error && (
                            <p className="text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}
                        <Button
                            type="submit"
                            data-testid="calculate-button"
                            disabled={loading}
                        >
                            {loading ? "Calculating…" : "Calculate"}
                        </Button>
                    </form>

                    {debugLines.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowDebug((v) => !v)}
                                className="text-sm text-muted-foreground hover:text-foreground underline"
                            >
                                {showDebug ? "Hide" : "Show"} debug
                            </button>
                            {showDebug && (
                                <pre className="rounded-md border bg-muted p-3 text-xs overflow-auto max-h-48">
                                    {debugLines.join("\n")}
                                </pre>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
