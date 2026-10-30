import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/documento-legal";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <DocumentoLegal
      titulo="Términos y condiciones"
      actualizado="30 de octubre de 2026"
      secciones={[
        ["Qué es Perfila", "Perfila es una plataforma tecnológica que conecta a personas que buscan un seguro con intermediarios de la actividad aseguradora (corredores, agentes y sociedades de corretaje) y con las empresas autorizadas que respaldan sus ofertas en la República Bolivariana de Venezuela. Perfila no es una empresa de seguros ni un intermediario, y no asume los riesgos cubiertos por las pólizas."],
        ["Intermediación", "Las ofertas son presentadas por intermediarios con autorización vigente de la SUDEASEG, a nombre de las empresas que representan. La póliza la emite la empresa y sus condiciones se rigen por el condicionado aprobado."],
        ["Cuenta de usuario", "Para usar Perfila debes ser mayor de 18 años, proporcionar información veraz y mantener la confidencialidad de tu contraseña. Eres responsable de la actividad realizada desde tu cuenta."],
        ["Perfil y ofertas", "La información de tu perfil se usa para que los intermediarios te envíen ofertas. Las primas mostradas como referenciales son orientativas; el precio final es el que indica cada oferta. La empresa puede solicitar información adicional antes de emitir la póliza."],
        ["Pagos", "Los pagos de primas se realizan directamente a la empresa por los medios que esta indique. Perfila registra el reporte de pago para facilitar su verificación, pero no custodia fondos."],
        ["Siniestros", "Los reclamos se gestionan con la empresa emisora según las condiciones de la póliza. Perfila facilita el reporte y el seguimiento."],
        ["Empresas e intermediarios", "Las empresas e intermediarios que participan declaran estar autorizados por la Superintendencia de la Actividad Aseguradora y se comprometen a ofrecer información clara sobre coberturas y exclusiones."], ["Claves de emergencia", "Los afiliados con una póliza de medicina prepagada activa pueden solicitar claves de emergencia, que la empresa puede confirmar o anular. En una emergencia que ponga en riesgo la vida, acude primero al centro de salud más cercano."],
        ["Contacto", "Para cualquier consulta sobre estos términos, escríbenos a soporte@perfila.app."],
      ]}
    />
  );
}
