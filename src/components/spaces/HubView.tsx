import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { motion, useInView } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Megaphone, FileText, Image, Video, Hash, PenTool, Type, Monitor,
  MessageSquare, Layout, Zap, Search, Mail, ShoppingBag, BarChart2,
  Smartphone, Globe, Palette, Camera, Star, BookOpen, ArrowRight,
  LayoutGrid, Plus, Sparkles
} from "lucide-react";

// ─── Template Definitions ────────────────────────────────────────────────────
import { type Template, CATEGORIES as TEMPLATE_CATEGORIES, TEMPLATES } from "@/lib/templates";
const NEW_TEMPLATE_IDS = new Set(TEMPLATES.slice(-5).map(t => t.id));
export const HubView = () => {
  const { user, signOut } = useAuth("/auth");
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = TEMPLATES.filter(t => {
    const matchCat = category === "Todos" || t.category === category;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    if (!user) return;
    try {
      const { data: space, error } = await supabase
        .from("spaces")
        .insert({ user_id: user.id, name: template.title, description: template.description })
        .select().single();
      if (error) throw error;

      // Seed canvas nodes from preset
      if (template.nodes.length > 0) {
        const nodeRows = template.nodes.map((node: any, i: number) => ({
          user_id: user.id,
          space_id: space.id,
          type: node.type || "modelView",
          name: node.data?.title || `Nodo ${i + 1}`,
          pos_x: 100 + i * 340,
          pos_y: 220,
          status: "idle",
          data_payload: node.data || {},
          prompt: "",
        }));

        const { data: insertedNodes, error: nodesError } = await supabase
          .from("canvas_nodes")
          .insert(nodeRows)
          .select("id");

        if (nodesError) throw nodesError;

        // Reconstruir los edges a partir del mapping original de la plantilla
        if (insertedNodes && insertedNodes.length > 0) {
          const edges = (template.edges || []).map((edgeInfo, idx) => {
            const srcNode = insertedNodes[edgeInfo.source];
            const targetNode = insertedNodes[edgeInfo.target];
            if (!srcNode || !targetNode) return null;
            
            return {
              id: `e-${srcNode.id}-${targetNode.id}-${idx}`,
              source: srcNode.id,
              target: targetNode.id,
              sourceHandle: edgeInfo.sourceHandle || 'any-out',
              targetHandle: edgeInfo.targetHandle || 'any-in',
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#a855f7', strokeWidth: 2 },
            };
          }).filter(Boolean);

          // Save edges as flow_metadata row
          // Important: use upsert to avoid duplicates and match the unique index
          await supabase.from("canvas_nodes").upsert({
            user_id: user.id,
            space_id: space.id,
            type: "flow_metadata",
            name: "__flow_metadata__",
            pos_x: 0,
            pos_y: 0,
            status: "idle",
            data_payload: { edges } as any,
            prompt: "metadata",
          }, { onConflict: 'space_id,type' });
        }
      }

      toast.success(`Plantilla "${template.title}" cargada`);
      navigate(`/studio-flow?spaceId=${space.id}`);
    } catch {
      toast.error("Error al crear espacio desde plantilla");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* Header */}
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] font-display">Hub de Plantillas</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-6xl font-bold tracking-tight font-display"
              >
                Proyectos & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Plantillas</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="text-sm text-zinc-400 font-medium"
              >
                {TEMPLATES.length} plantillas profesionales — 1 clic para abrir en el Studio.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex items-center gap-3 shrink-0"
            >
              <div className="px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-display">
                {filtered.length} resultados
              </div>
            </motion.div>
          </div>

          {/* Category & Search Filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            {/* Category Filter — Tailwind UI style pill tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold whitespace-nowrap transition-all duration-300 font-display uppercase tracking-widest ${
                    category === cat
                      ? "bg-primary text-white shadow-sm"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {cat}
                  {cat !== "Todos" && (
                    <span className={`ml-2 text-[9px] tabular-nums ${category === cat ? "opacity-40" : "opacity-40"}`}>
                      {TEMPLATES.filter(t => t.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar plantillas..."
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[12px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-display"
              />
            </div>
          </div>

          {/* Template Grid — Tailwind UI card grid pattern */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Create from scratch card */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.03, borderColor: "rgba(168,85,247,0.3)" }}
              whileTap={{ scale: 0.97 }}
              aria-label="Crear lienzo en blanco — nuevo proyecto vacío"
              onClick={() => {
                supabase.from("spaces").insert({ user_id: user?.id || "", name: "Nuevo Proyecto" })
                  .select().single()
                  .then(({ data }) => {
                    if (data) navigate(`/studio-flow?spaceId=${data.id}`);
                    else navigate("/studio-flow");
                  });
              }}
              className="rounded-[2rem] border border-dashed border-zinc-200 group flex flex-col items-center justify-center py-12 gap-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-12 h-12 rounded-2xl bg-zinc-100 border border-dashed border-zinc-200 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all"
              >
                <Plus className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase tracking-widest font-display">Lienzo en Blanco</p>
                <p className="text-[10px] text-zinc-500 font-display uppercase tracking-[0.15em]">Empieza desde cero</p>
              </div>
            </motion.button>

            {filtered.map((template, idx) => {
              return (<motion.div
                key={template.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.35 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                className="rounded-[2rem] border border-zinc-200 group flex flex-col gap-5 p-6 transition-all duration-300 overflow-hidden relative"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${template.color}30`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${template.color}12`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgb(228,228,231)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                {/* Color accent bar at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[2rem] opacity-60" style={{ background: `linear-gradient(90deg, ${template.color}80, transparent)` }} />

                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${template.color}12`, border: `1px solid ${template.color}20` }}
                  >
                    <template.icon className="w-5 h-5" style={{ color: template.color }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {NEW_TEMPLATE_IDS.has(template.id) && (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest font-display">
                        Nuevo
                      </span>
                    )}
                    <span
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest font-display"
                      style={{ background: `${template.color}10`, color: template.color, border: `1px solid ${template.color}15` }}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-bold text-zinc-900 leading-tight font-display tracking-tight">{template.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed truncate-2">{template.description}</p>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap">
                  {template.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest font-display">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer — Tailwind UI divider + action pattern */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                  <span className="text-[10px] text-zinc-400 font-bold font-display uppercase tracking-widest">{template.nodes?.length || 0} nodos</span>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    aria-label={`Usar plantilla: ${template.title}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 active:scale-95 uppercase tracking-widest font-display"
                    style={{
                      background: `${template.color}12`,
                      color: template.color,
                      border: `1px solid ${template.color}20`
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${template.color}22`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${template.color}12`;
                    }}
                  >
                    Usar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );})}
          </div>

          <p className="text-center text-[10px] text-zinc-400 mt-12 font-bold uppercase tracking-[0.3em] font-display">
            {TEMPLATES.length} plantillas disponibles · Más con cada actualización
          </p>
    </div>
  );
};
