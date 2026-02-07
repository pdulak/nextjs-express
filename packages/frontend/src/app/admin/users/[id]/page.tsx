"use client";

import { useState, useEffect, use } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import type { UserDetail, PermissionItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function UserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: authUser, loading: authLoading } = useRequireAuth("admin");
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    if (authUser && id) {
      api
        .get(`/users/${id}`)
        .then((data) => {
          setUserDetail(data.user);
          setAllPermissions(data.allPermissions);
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setIsActive(data.user.is_active ?? true);
          setSelectedPermissions(data.user.permissions || []);
        })
        .catch(() => {});
    }
  }, [authUser, id]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await api.put(`/users/${id}`, { name, email, is_active: isActive });
      toast.success("User details updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSavingDetails(false);
    }
  };

  const handlePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPermissions(true);
    try {
      await api.put(`/users/${id}/permissions`, {
        permissionCodes: selectedPermissions,
      });
      toast.success("Permissions updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update permissions"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code)
        ? prev.filter((p) => p !== code)
        : [...prev, code]
    );
  };

  if (authLoading || !authUser || !userDetail) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button type="submit" disabled={savingDetails}>
                {savingDetails ? "Saving..." : "Save Details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handlePermissionsSubmit}
              className="flex flex-col gap-4"
            >
              {allPermissions.map((perm) => (
                <div key={perm.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`perm-${perm.code}`}
                    checked={selectedPermissions.includes(perm.code)}
                    onCheckedChange={() => togglePermission(perm.code)}
                  />
                  <Label htmlFor={`perm-${perm.code}`}>{perm.name}</Label>
                </div>
              ))}
              <Button type="submit" disabled={savingPermissions}>
                {savingPermissions ? "Saving..." : "Save Permissions"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingPassword(true);
                try {
                  await api.put(`/users/${id}/password`, {
                    password: newPassword,
                  });
                  toast.success("Password updated");
                  setNewPassword("");
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to update password"
                  );
                } finally {
                  setSavingPassword(false);
                }
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Saving..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
