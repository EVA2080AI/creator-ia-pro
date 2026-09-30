import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Mail, Shield, Zap } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const FOOTER_LINKS = [
    {
      title: "Plataforma",
      links: [
        { name: "Basalt IA", path: "/a/basalt" },
        { name: "Canvas IA", path: "/studio-flow" },
        { name: "Precios", path: "/pricing" },
      ]
    },
    {
      title: "Soporte",
      links: [
        { name: "Ayuda y documentación", path: "/help" },
        // "Estado del Sistema" (/system-status) salió de acá: exige sesión (no está en
        // publicPaths de App.tsx), así que a un visitante lo mandaba al login desde el pie.
        // Sigue en el menú de admin. "Comunidad" apuntaba a https://discord.gg, que no es
        // ningún servidor. "Contacto" abría el correo: ahora va a la página, que existe.
        { name: "Contacto", path: "/contact" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Términos", path: "/terms" },
        { name: "Privacidad", path: "/privacy" },
        { name: "Seguridad", path: "/security" },
        // /cookies existía sin un solo enlace en toda la app: solo se llegaba escribiendo la URL.
        { name: "Cookies", path: "/cookies" },
      ]
    }
  ];

  return (
    <footer className="bg-white border-t border-zinc-100 pt-20 pb-10">
      <div className="container px-6 mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <Logo className="h-7 w-auto" />
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs font-medium">
              La plataforma de IA todo-en-uno para crear apps, imágenes y contenido en segundos.
            </p>
            {/* Eran cuatro iconos con href="#": no llevaban a ningún lado. Queda el correo,
                que sí existe; las redes vuelven cuando haya cuentas reales que enlazar. */}
            <a
              href="mailto:hola@creator-ia.com"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" /> hola@creator-ia.com
            </a>
          </div>

          {/* Link Groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="text-zinc-950 font-black uppercase tracking-widest text-[10px] mb-6 italic">{group.title}</h3>
              <ul className="space-y-4">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path} 
                      className="text-zinc-500 hover:text-primary text-sm font-medium transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-zinc-100 gap-6">
          <p className="text-zinc-500 text-xs font-medium italic">
            © {currentYear} Creator IA Pro. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <Shield className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">AES-256</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Pagos en COP</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
