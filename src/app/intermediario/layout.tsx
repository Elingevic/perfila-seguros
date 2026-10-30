import { Shell } from "@/components/shell";
import { Alerta } from "@/components/ui";
import { requerirIntermediario } from "@/lib/dal";

export default async function IntermediarioLayout({ children }: { children: React.ReactNode }) {
  const user = await requerirIntermediario();
  const estado = user.intermediario.estado;
  return (
    <Shell user={user}>
      {estado === "PENDIENTE" && (
        <div className="mb-6">
          <Alerta tono="amber">
            <b>Estamos verificando tu autorización ({user.intermediario.numeroAutorizacion}).</b> Cuando el equipo de Perfila la
            confirme podrás vincularte a empresas y enviar ofertas.
          </Alerta>
        </div>
      )}
      {estado === "SUSPENDIDA" && (
        <div className="mb-6">
          <Alerta>
            <b>Tu cuenta de intermediario está suspendida.</b> No puedes enviar ofertas. Contacta a soporte.
          </Alerta>
        </div>
      )}
      {children}
    </Shell>
  );
}
