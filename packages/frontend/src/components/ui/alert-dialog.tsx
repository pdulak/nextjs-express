"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | undefined>(undefined);

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be used within AlertDialog");
  }
  return context;
}

export function AlertDialog({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <AlertDialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useAlertDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        setOpen(true);
        children.props.onClick?.(e);
      },
    } as any);
  }

  return <button onClick={() => setOpen(true)}>{children}</button>;
}

export function AlertDialogContent({
  children,
  position = "center"
}: {
  children: React.ReactNode;
  position?: "center" | "bottom-left";
}) {
  const { open, setOpen } = useAlertDialog();

  if (!open) return null;

  const positionClasses = position === "center"
    ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    : "left-1/4 bottom-32 -translate-x-1/2";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/80"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className={`fixed z-[101] ${positionClasses} w-full max-w-lg`}>
        <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-6 space-y-4">
          {children}
        </div>
      </div>
    </>
  );
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2">{children}</div>;
}

export function AlertDialogAction({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) {
  const { setOpen } = useAlertDialog();

  return (
    <Button
      variant={variant}
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
    >
      {children}
    </Button>
  );
}

export function AlertDialogCancel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setOpen } = useAlertDialog();

  return (
    <Button variant="outline" onClick={() => setOpen(false)}>
      {children}
    </Button>
  );
}
