"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            Home
          </Link>
        </div>

        {!loading && (
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.permissions.includes("admin") && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/users">Users</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
