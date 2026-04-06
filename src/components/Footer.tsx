import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Github, Twitter, Linkedin, Mail, Shield, Zap } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const FOOTER_LINKS = [
    {
      title: "Plataforma",
      links: [
        { name: "Genesis IDE", path: "/chat" },
        { name: "Studio Flow", path: "/studio" },
        { name: "Canvas IA", path: "/formarketing" },
        { name: "Precios", path: "/pricing" },
      ]
    },
    {
      title: "Soporte",
      links: [
        { name: "Documentación", path: "/documentation" },
        { name: "Estado del Sistema", path: "/system-status" },
        { name: "Comunidad", path: "https://discord.gg" },
        { name: "Contacto", path: "mailto:hola@creator-ia.com" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Términos", path: "/terms" },
        { name: "Privacidad", path: "/privacy" },
        { name: "Seguridad", path: "/security" },
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
              Elevando la ingeniería de software mediante autonomía pura y síntesis inteligente.
            </p>
            <div className="flex items-center gap-4 text-zinc-400">
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Github className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Mail className="h-5 w-5" /></a>
            </div>
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
          <p className="text-zinc-400 text-xs font-medium italic">
            © {currentYear} CREATOR IA PRO · UNIVERSAL ENGINEERING SOVEREIGNTY
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <Shield className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">v21.0 Certified</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
