export default function MusicAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override parent layout's container to allow full-width split view
  return <>{children}</>;
}
