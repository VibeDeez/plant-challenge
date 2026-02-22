import ProtectedLayout from "@/components/ProtectedLayout";

export default function ProtectedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
