"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import type { BloodPressureRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PRESSURE_ZONES = [
  { systolicMin: 160, systolicMax: 300, diastolicMin: 100, diastolicMax: 200, color: "text-red-500" },
  { systolicMin: 140, systolicMax: 160, diastolicMin: 90, diastolicMax: 100, color: "text-orange-400" },
  { systolicMin: 130, systolicMax: 140, diastolicMin: 85, diastolicMax: 90, color: "text-yellow-400" },
  { systolicMin: 120, systolicMax: 130, diastolicMin: 80, diastolicMax: 85, color: "text-green-400" },
  { systolicMin: 0, systolicMax: 120, diastolicMin: 0, diastolicMax: 80, color: "text-sky-400" },
];

const PRESSURE_ZONE_CHART_COLORS = [
  { systolicMin: 160, systolicMax: 300, diastolicMin: 100, diastolicMax: 200, color: "red" },
  { systolicMin: 140, systolicMax: 160, diastolicMin: 90, diastolicMax: 100, color: "orange" },
  { systolicMin: 130, systolicMax: 140, diastolicMin: 85, diastolicMax: 90, color: "yellow" },
  { systolicMin: 120, systolicMax: 130, diastolicMin: 80, diastolicMax: 85, color: "lightgreen" },
  { systolicMin: 0, systolicMax: 120, diastolicMin: 0, diastolicMax: 80, color: "lightblue" },
];

function getPressureZoneClass(systolic: number, diastolic: number): string {
  for (const zone of PRESSURE_ZONES) {
    if (
      (systolic >= zone.systolicMin && systolic <= zone.systolicMax) ||
      (diastolic >= zone.diastolicMin && diastolic <= zone.diastolicMax)
    ) {
      return zone.color;
    }
  }
  return "";
}

function getPressureZoneColor(systolic: number, diastolic: number): string {
  for (const zone of PRESSURE_ZONE_CHART_COLORS) {
    if (
      (systolic >= zone.systolicMin && systolic <= zone.systolicMax) ||
      (diastolic >= zone.diastolicMin && diastolic <= zone.diastolicMax)
    ) {
      return zone.color;
    }
  }
  return "gray";
}

function formatDateTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return date.toLocaleString("sv-SE").slice(0, 16);
}

function formatDateShort(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString("sv-SE");
}

const TIME_FRAMES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
];

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { systolic: number; diastolic: number };
}

function PressureDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload) return null;
  const color = getPressureZoneColor(payload.systolic, payload.diastolic);
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
}

export default function BloodPressurePage() {
  const { user, loading } = useRequireAuth();
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [days, setDays] = useState(30);
  const [view, setView] = useState<"table" | "charts">("table");
  const [fetching, setFetching] = useState(true);

  const fetchRecords = useCallback(async (filterDays: number) => {
    setFetching(true);
    try {
      const data = await api.get(`/blood-pressure?days=${filterDays}`);
      setRecords(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch records");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRecords(days);
  }, [user, days, fetchRecords]);

  const handleTimeFrame = (d: number) => {
    setDays(d);
  };

  if (loading || !user) return null;

  const chartData = [...records].reverse().map((r) => ({
    date: formatDateShort(r.dateTime),
    systolic: r.systolic,
    diastolic: r.diastolic,
    pulse: r.pulse,
    weight: r.weight,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blood Pressure</h1>
        <Button asChild>
          <Link href="/blood-pressure/add">Add</Link>
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TIME_FRAMES.map((tf) => (
          <Button
            key={tf.days}
            variant={days === tf.days ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeFrame(tf.days)}
          >
            {tf.label}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            Table
          </Button>
          <Button
            variant={view === "charts" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("charts")}
          >
            Charts
          </Button>
        </div>
      </div>

      {fetching ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : view === "table" ? (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Systolic</TableHead>
                <TableHead>Diastolic</TableHead>
                <TableHead>Pulse</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => {
                  const zoneClass = getPressureZoneClass(r.systolic, r.diastolic);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{formatDateTime(r.dateTime)}</TableCell>
                      <TableCell className={zoneClass}>{r.systolic}</TableCell>
                      <TableCell className={zoneClass}>{r.diastolic}</TableCell>
                      <TableCell>{r.pulse}</TableCell>
                      <TableCell>{r.weight}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blood-pressure/${r.id}`}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">Blood Pressure</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="rgb(143, 75, 90)"
                  dot={<PressureDot />}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="rgb(67, 100, 122)"
                  dot={<PressureDot />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Weight</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="rgba(75, 192, 192, 1)"
                  fill="rgba(75, 192, 192, 0.7)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
