import { BotonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl">🔎</div>
      <h1 className="mt-4 text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-slate-600">Puede que el enlace esté roto o que no tengas acceso.</p>
      <BotonLink href="/" className="mt-6">Ir al inicio</BotonLink>
    </div>
  );
}
