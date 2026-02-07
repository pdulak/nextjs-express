"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

function toLocalDateTimeString(dateTimeStr: string) {
  const date = new Date(dateTimeStr);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EditBloodPressurePage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [dateTime, setDateTime] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const record = await api.get(`/blood-pressure/${id}`);
        setDateTime(toLocalDateTimeString(record.dateTime));
        setSystolic(String(record.systolic));
        setDiastolic(String(record.diastolic));
        setPulse(String(record.pulse));
        setWeight(String(record.weight));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load record");
      } finally {
        setFetching(false);
      }
    })();
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/blood-pressure/${id}`, {
        dateTime,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: Number(pulse),
        weight: Number(weight),
      });
      toast.success("Record updated");
      router.push("/blood-pressure");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    setDeleting(true);
    try {
      await api.delete(`/blood-pressure/${id}`);
      toast.success("Record deleted");
      router.push("/blood-pressure");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user || fetching) return null;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Edit Blood Pressure Record</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit Record</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateTime">Date and Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="systolic">Systolic</Label>
              <Input
                id="systolic"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="diastolic">Diastolic</Label>
              <Input
                id="diastolic"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pulse">Pulse</Label>
              <Input
                id="pulse"
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete Record"}
      </Button>
    </div>
  );
}
