import { Shell } from "@/components/shell";
import { requerirRol } from "@/lib/dal";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requerirRol("ADMIN");
  return <Shell user={user}>{children}</Shell>;
}
