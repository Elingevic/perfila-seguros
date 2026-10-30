import { Shell } from "@/components/shell";
import { requerirRol } from "@/lib/dal";

export default async function PersonaLayout({ children }: { children: React.ReactNode }) {
  const user = await requerirRol("PERSONA");
  return <Shell user={user}>{children}</Shell>;
}
