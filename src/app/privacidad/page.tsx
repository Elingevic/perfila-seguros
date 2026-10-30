import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/documento-legal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <DocumentoLegal
      titulo="Política de privacidad"
      actualizado="30 de octubre de 2026"
      secciones={[
        ["Datos que recopilamos", "Nombre, correo, teléfono y los datos de tu perfil asegurador: fecha de nacimiento, estado de residencia, ocupación, vehículo, número de dependientes, autodeclaración de salud y presupuesto."],
        ["Perfil anónimo", "Los intermediarios (corredores, agentes y sociedades de corretaje) solo ven un código de perfil y datos no identificables (edad, estado, ocupación, vehículo, dependientes, presupuesto y ramos buscados). Tu autodeclaración de salud no se muestra."],
        ["Cuándo compartimos tus datos de contacto", "Solo cuando aceptas una oferta compartimos tu nombre, correo y teléfono con el intermediario y la empresa de esa oferta, para que puedan emitir y gestionar tu póliza."],
        ["Seguridad", "Tus contraseñas se almacenan cifradas y la comunicación con la plataforma está protegida. El acceso a los datos está restringido según el rol de cada usuario."],
        ["Tus derechos", "Puedes consultar y actualizar tu perfil en cualquier momento, retirar tu perfil del mercado y solicitar la eliminación de tu cuenta escribiendo a soporte@perfila.app."],
        ["Conservación", "Conservamos la información de pólizas, pagos y siniestros durante el tiempo exigido por la normativa aplicable."],
      ]}
    />
  );
}
