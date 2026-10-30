import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/documento-legal";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <DocumentoLegal
      titulo="Términos y condiciones"
      actualizado="30 de octubre de 2026"
      secciones={[
        ["Qué es Perfila", "Perfila es una plataforma tecnológica que conecta a personas que buscan un seguro con empresas de seguros autorizadas para operar en la República Bolivariana de Venezuela. Perfila no es una empresa de seguros y no asume los riesgos cubiertos por las pólizas."],
        ["Intermediación", "La contratación de pólizas se realiza con la aseguradora que emite la oferta, a través de los intermediarios de seguros habilitados que correspondan conforme a la normativa vigente. Las condiciones de cada póliza se rigen por el condicionado aprobado de la aseguradora."],
        ["Cuenta de usuario", "Para usar Perfila debes ser mayor de 18 años, proporcionar información veraz y mantener la confidencialidad de tu contraseña. Eres responsable de la actividad realizada desde tu cuenta."],
        ["Perfil y ofertas", "La información de tu perfil se usa para que las aseguradoras te envíen ofertas. Las primas mostradas como referenciales son orientativas; el precio final es el que indica cada oferta. Las aseguradoras pueden solicitar información adicional antes de emitir la póliza."],
        ["Pagos", "Los pagos de primas se realizan directamente a la aseguradora por los medios que esta indique. Perfila registra el reporte de pago para facilitar su verificación, pero no custodia fondos."],
        ["Siniestros", "Los reclamos se gestionan con la aseguradora emisora según las condiciones de la póliza. Perfila facilita el reporte y el seguimiento."],
        ["Aseguradoras", "Las aseguradoras que participan declaran estar autorizadas por la Superintendencia de la Actividad Aseguradora y se comprometen a ofrecer información clara sobre coberturas y exclusiones."],
        ["Contacto", "Para cualquier consulta sobre estos términos, escríbenos a soporte@perfila.app."],
      ]}
    />
  );
}
