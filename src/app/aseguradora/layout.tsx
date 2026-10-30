import { Shell } from "@/components/shell";
import { Alerta } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";

export default async function AseguradoraLayout({ children }: { children: React.ReactNode }) {
  const user = await requerirAseguradora();
  const estado = user.aseguradora.estado;
  return (
    <Shell user={user}>
      {estado === "PENDIENTE" && (
        <div className="mb-6">
          <Alerta tono="amber">
            <b>Tu aseguradora está en verificación.</b> Mientras tanto puedes completar la configuración. Podrás ver perfiles y enviar ofertas
            cuando el equipo de Perfila apruebe tu cuenta.
          </Alerta>
        </div>
      )}
      {estado === "SUSPENDIDA" && (
        <div className="mb-6">
          <Alerta>
            <b>Tu aseguradora está suspendida.</b> No puedes enviar ofertas ni gestionar pólizas. Contacta a soporte.
          </Alerta>
        </div>
      )}
      {children}
    </Shell>
  );
}
