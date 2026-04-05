/**
 * Scaffold Service — Multi-Page Project Generator (Industrial V4.0)
 *
 * Generates complete project structures as a virtual file map,
 * then packages them into a downloadable ZIP via JSZip.
 *
 * Supported stacks:
 *   - React (Vite + React-Router + TypeScript + Tailwind)
 *   - Next.js (App Router + TypeScript + Tailwind)
 *   - Node.js (Express + TypeScript)
 *   - Python (FastAPI)
 */
import JSZip from 'jszip';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProjectType = 'react' | 'nextjs' | 'node' | 'python' | 'game';

export interface ScaffoldOptions {
  projectName: string;
  pages: string[];              // e.g. ['Home', 'About', 'Contact']
  projectType: ProjectType;
  includeAuth: boolean;
  includeSupa: boolean;
  darkMode: boolean;
  description?: string;
}

export interface ScaffoldResult {
  files: Map<string, string>;
  blob: Blob;
  fileCount: number;
  projectType: ProjectType;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pascalCase(s: string): string {
  return s.replace(/(^|[\s-_]+)\w/g, (m) => m.toUpperCase()).replace(/[\s-_]+/g, '');
}

const DEPENDENCY_RULES = [
  { keywords: ['pago', 'stripe', 'venda', 'checkout'], deps: { 'stripe': '^16.0.0', '@stripe/stripe-js': '^4.0.0' } },
  { keywords: ['animac', 'motion', 'framer'], deps: { 'framer-motion': '^11.0.0' } },
  { keywords: ['grafic', 'chart', 'data', 'recharts'], deps: { 'recharts': '^2.12.0', 'lucide-react': '^0.462.0' } },
  { keywords: ['chat', 'mensaje', 'realtime'], deps: { '@supabase/supabase-js': '^2.45.0', 'lucide-react': '^0.462.0' } },
  { keywords: ['mapa', 'google maps', 'leaflet'], deps: { 'leaflet': '^1.9.4', '@types/leaflet': '^1.9.12' } },
];

function getDynamicDeps(description: string = ''): Record<string, string> {
  const d = description.toLowerCase();
  const extra: Record<string, string> = {};
  DEPENDENCY_RULES.forEach(rule => {
    if (rule.keywords.some(k => d.includes(k))) {
      Object.assign(extra, rule.deps);
    }
  });
  return extra;
}

// ─── React (Vite) Templates ────────────────────────────────────────────────

function generateReactProject(opts: ScaffoldOptions): Map<string, string> {
  const files = new Map<string, string>();
  const slug = slugify(opts.projectName);

  // package.json
  files.set('package.json', JSON.stringify({
    name: slug,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'react-router-dom': '^6.30.1',
      'lucide-react': '^0.462.0',
      ...(opts.includeSupa ? { '@supabase/supabase-js': '^2.98.0' } : {}),
      ...getDynamicDeps(opts.description || opts.projectName),
    },
    devDependencies: {
      '@vitejs/plugin-react-swc': '^3.11.0',
      '@types/react': '^18.3.23',
      '@types/react-dom': '^18.3.7',
      typescript: '^5.8.3',
      vite: '^5.4.19',
      autoprefixer: '^10.4.21',
      postcss: '^8.5.6',
      tailwindcss: '^3.4.17',
    },
  }, null, 2));

  // vite.config.ts
  files.set('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
});
`);

  // tsconfig.json
  files.set('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
  }, null, 2));

  // tailwind.config.js
  files.set('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};
`);

  // postcss.config.js
  files.set('postcss.config.js', `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
`);

  // index.html
  files.set('index.html', `<!DOCTYPE html>
<html lang="es"${opts.darkMode ? ' class="dark"' : ''}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${opts.projectName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body class="${opts.darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  // src/index.css
  files.set('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
`);

  // src/main.tsx
  const routeImports = opts.pages.map(p => `import ${pascalCase(p)}Page from './pages/${pascalCase(p)}';`).join('\n');
  const routeElements = opts.pages.map((p, i) => {
    const path = i === 0 ? '/' : `/${slugify(p)}`;
    return `        <Route path="${path}" element={<${pascalCase(p)}Page />} />`;
  }).join('\n');

  files.set('src/main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
${routeImports}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
${routeElements}
          <Route path="*" element={<${pascalCase(opts.pages[0])}Page />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
`);

  // src/components/Layout.tsx — Abstract Architecture
  const navLinks = opts.pages.map((p, i) => {
    const path = i === 0 ? '/' : `/${slugify(p)}`;
    return `          <NavLink to="${path}" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`}>${p}</NavLink>`;
  }).join('\n');

  files.set('src/components/Layout.tsx', `import { NavLink, Outlet } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-content">
          <span className="brand">${opts.projectName}</span>
          <div className="nav-links">
${navLinks}
          </div>
        </div>
      </nav>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} ${opts.projectName}</p>
        </div>
      </footer>
    </div>
  );
}
`);

  // Generate each page
  opts.pages.forEach((page, idx) => {
    const name = pascalCase(page);
    const isHome = idx === 0;
    const bg = opts.darkMode ? 'bg-gray-950' : 'bg-white';
    const textPrimary = opts.darkMode ? 'text-white' : 'text-gray-900';
    const textSecondary = opts.darkMode ? 'text-gray-400' : 'text-gray-600';

    const heroContent = isHome ? `
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b ${opts.darkMode ? 'from-blue-600/10 to-transparent' : 'from-blue-50 to-transparent'}" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight ${textPrimary} mb-6">
            ${opts.projectName}
          </h1>
          <p className="text-xl ${textSecondary} max-w-2xl mx-auto mb-10">
            ${opts.description || 'Bienvenido a tu nuevo proyecto. Construido con React, TypeScript y Tailwind CSS.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:shadow-lg active:scale-95">
              Comenzar
            </button>
            <button className="px-8 py-3 ${opts.darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-semibold rounded-xl transition-all">
              Ver más
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold ${textPrimary} text-center mb-16">Características</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Rápido', desc: 'Rendimiento optimizado para cargas instantáneas.' },
              { title: 'Escalable', desc: 'Arquitectura preparada para crecer con tu proyecto.' },
              { title: 'Moderno', desc: 'Stack tecnológico de última generación.' },
            ].map((f, i) => (
              <div key={i} className="${opts.darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-2xl border p-8 hover:scale-[1.02] transition-transform">
                <h3 className="text-lg font-bold ${textPrimary} mb-2">{f.title}</h3>
                <p className="${textSecondary} text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>` : `
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold ${textPrimary} mb-6">${page}</h1>
          <p className="${textSecondary} text-lg">
            Contenido de la página ${page}. Personaliza este componente según tus necesidades.
          </p>
        </div>
      </section>`;

    files.set(`src/pages/${name}.tsx`, `export default function ${name}Page() {
  return (
    <div className="${bg} min-h-screen">
${heroContent}
    </div>
  );
}
`);
  });

  // Supabase client (optional)
  if (opts.includeSupa) {
    files.set('src/lib/supabase.ts', `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
`);
    files.set('.env.example', `VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
`);
  }

  // README.md
  files.set('README.md', `# ${opts.projectName}

${opts.description || 'Proyecto generado con Genesis AI — Creator IA Pro.'}

## Stack
- React 18 + TypeScript
- Vite
- React Router v6
- Tailwind CSS
${opts.includeSupa ? '- Supabase' : ''}

## Páginas
${opts.pages.map((p, i) => `- ${p} → \`${i === 0 ? '/' : '/' + slugify(p)}\``).join('\n')}

## Desarrollo
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build
\`\`\`bash
npm run build
\`\`\`

---
Generado con [Genesis AI](https://creator-ia.com)
`);

  return files;
}

// ─── Next.js Templates ─────────────────────────────────────────────────────

function generateNextProject(opts: ScaffoldOptions): Map<string, string> {
  const files = new Map<string, string>();
  const slug = slugify(opts.projectName);

  files.set('package.json', JSON.stringify({
    name: slug,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      next: '^14.2.0',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'lucide-react': '^0.462.0',
      ...(opts.includeSupa ? { '@supabase/supabase-js': '^2.98.0' } : {}),
      ...getDynamicDeps(opts.description || opts.projectName),
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      '@types/react': '^18.3.23',
      '@types/react-dom': '^18.3.7',
      typescript: '^5.8.3',
      autoprefixer: '^10.4.21',
      postcss: '^8.5.6',
      tailwindcss: '^3.4.17',
    },
  }, null, 2));

  files.set('next.config.mjs', `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`);

  files.set('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2));

  // App Router layout
  files.set('src/app/layout.tsx', `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${opts.projectName}',
  description: '${opts.description || 'Built with Genesis AI'}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es"${opts.darkMode ? ' className="dark"' : ''}>
      <body className="${opts.darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} antialiased">
        {children}
      </body>
    </html>
  );
}
`);

  files.set('src/app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

  // Generate pages using App Router
  opts.pages.forEach((page, idx) => {
    const path = idx === 0 ? 'src/app/page.tsx' : `src/app/${slugify(page)}/page.tsx`;
    files.set(path, `export default function ${pascalCase(page)}Page() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl font-black tracking-tight mb-6">${page}</h1>
        <p className="${opts.darkMode ? 'text-gray-400' : 'text-gray-600'} text-lg">
          Página ${page} del proyecto ${opts.projectName}.
        </p>
      </div>
    </main>
  );
}
`);
  });

  files.set('README.md', `# ${opts.projectName}

## Stack: Next.js 14 + TypeScript + Tailwind CSS

### Desarrollo
\`\`\`bash
npm install
npm run dev
\`\`\`
`);

  return files;
}

// ─── Node.js (Express) Templates ────────────────────────────────────────────

function generateNodeProject(opts: ScaffoldOptions): Map<string, string> {
  const files = new Map<string, string>();
  const slug = slugify(opts.projectName);

  files.set('package.json', JSON.stringify({
    name: slug + '-api',
    version: '0.1.0',
    main: 'dist/index.js',
    scripts: {
      dev: 'ts-node-dev --respawn src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
    },
    dependencies: {
      express: '^4.19.2',
      cors: '^2.8.5',
      dotenv: '^16.4.5',
      ...(opts.includeSupa ? { '@supabase/supabase-js': '^2.98.0' } : {}),
    },
    devDependencies: {
      '@types/express': '^4.17.21',
      '@types/cors': '^2.8.17',
      '@types/node': '^22.0.0',
      typescript: '^5.8.3',
      'ts-node-dev': '^2.0.0',
    },
  }, null, 2));

  files.set('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
    },
    include: ['src'],
  }, null, 2));

  // Routes
  const routeImports = opts.pages.map(p => `import { ${slugify(p)}Router } from './routes/${slugify(p)}';`).join('\n');
  const routeMounts = opts.pages.map(p => `app.use('/api/${slugify(p)}', ${slugify(p)}Router);`).join('\n');

  files.set('src/index.ts', `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
${routeImports}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Routes
${routeMounts}

app.listen(PORT, () => console.log(\`🚀 API running on http://localhost:\${PORT}\`));
`);

  opts.pages.forEach(page => {
    const s = slugify(page);
    files.set(`src/routes/${s}.ts`, `import { Router } from 'express';

export const ${s}Router = Router();

${s}Router.get('/', (_req, res) => {
  res.json({ page: '${page}', message: 'API route for ${page}' });
});
`);
  });

  files.set('.env.example', `PORT=3001
${opts.includeSupa ? 'SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nSUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY' : ''}
`);

  files.set('README.md', `# ${opts.projectName} — API

## Stack: Node.js + Express + TypeScript

### Desarrollo
\`\`\`bash
npm install
npm run dev
\`\`\`

### Endpoints
- GET /api/health — Health check
${opts.pages.map(p => `- GET /api/${slugify(p)} — ${p}`).join('\n')}
`);

  return files;
}

// ─── Python (FastAPI) Templates ─────────────────────────────────────────────

function generatePythonProject(opts: ScaffoldOptions): Map<string, string> {
  const files = new Map<string, string>();

  files.set('requirements.txt', `fastapi==0.115.0
uvicorn[standard]==0.30.6
python-dotenv==1.0.1
pydantic==2.9.2
${opts.includeSupa ? 'supabase==2.7.4' : ''}
`);

  const routeImports = opts.pages.map(p => `from app.routes.${slugify(p)} import router as ${slugify(p)}_router`).join('\n');
  const routeIncludes = opts.pages.map(p => `app.include_router(${slugify(p)}_router, prefix="/api/${slugify(p)}", tags=["${p}"])`).join('\n');

  files.set('main.py', `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
${routeImports}

app = FastAPI(title="${opts.projectName}", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

${routeIncludes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`);

  opts.pages.forEach(page => {
    files.set(`app/routes/${slugify(page)}.py`, `from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_${slugify(page).replace(/-/g, '_')}():
    return {"page": "${page}", "message": "API route for ${page}"}
`);
  });

  files.set('app/__init__.py', '');

  files.set('.env.example', `${opts.includeSupa ? 'SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nSUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY' : ''}
`);

  files.set('Dockerfile', `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`);

  files.set('README.md', `# ${opts.projectName} — API

## Stack: Python + FastAPI

### Desarrollo
\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`

### Docker
\`\`\`bash
docker build -t ${slugify(opts.projectName)} .
docker run -p 8000:8000 ${slugify(opts.projectName)}
\`\`\`

### Endpoints
- GET /api/health — Health check
${opts.pages.map(p => `- GET /api/${slugify(p)} — ${p}`).join('\n')}
`);

  return files;
}

function generateGameProject(opts: ScaffoldOptions): Map<string, string> {
  const files = new Map<string, string>();
  const slug = slugify(opts.projectName);

  // package.json with game deps
  files.set('package.json', JSON.stringify({
    name: slug,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      three: '^0.170.0',
      '@types/three': '^0.169.0',
      '@react-three/fiber': '^8.17.10',
      '@react-three/drei': '^9.117.0',
      'zustand': '^5.0.1',
      'lucide-react': '^0.462.0',
      'framer-motion': '^11.11.17',
    },
    devDependencies: {
      '@vitejs/plugin-react-swc': '^3.11.0',
      typescript: '^5.8.3',
      vite: '^5.4.19',
      tailwindcss: '^3.4.17',
      autoprefixer: '^10.4.21',
      postcss: '^8.5.6',
    },
  }, null, 2));

  files.set('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
export default defineConfig({ plugins: [react()] });`);

  files.set('src/store/useGameStore.ts', `import { create } from 'zustand';

interface GameState {
  score: number;
  isPaused: boolean;
  addScore: (points: number) => void;
  togglePause: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  isPaused: false,
  addScore: (points) => set((state) => ({ score: state.score + points })),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));`);

  files.set('src/components/Scene.tsx', `import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export function Scene() {
  const boxRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (boxRef.current) {
      boxRef.current.rotation.x += delta;
      boxRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <>
      <OrbitControls makeDefault />
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      
      <Box ref={boxRef} args={[1, 1, 1]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#0066FF" metalness={0.5} roughness={0.2} />
      </Box>

      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
      <gridHelper args={[20, 20, 0xffffff, 0x333333]} />
    </>
  );
}`);

  files.set('App.tsx', `import { Canvas } from '@react-three/fiber';
import { Scene } from './src/components/Scene';
import { useGameStore } from './src/store/useGameStore';

export default function App() {
  const { score, addScore } = useGameStore();

  return (
    <div className="w-full h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <Scene />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 text-white z-10 pointer-events-none">
        <h1 className="text-4xl font-black tracking-tighter mb-2">DEEP IA 1A ENGINE</h1>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Score</span>
            <span className="text-2xl font-mono">${'${score}'}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10">
        <button 
          onClick={() => addScore(100)}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[24px] shadow-2xl transition-all active:scale-95 pointer-events-auto"
        >
          CLICK TO PLAY
        </button>
      </div>
    </div>
  );
}`);

  files.set('README.md', `# ${opts.projectName} — Deep IA 1A Game Core

Generated by Genesis IA 1A.

## Tech Stack
- React + Vite + TypeScript
- Three.js + React Three Fiber (3D Engine)
- Zustand (State Management)
- Tailwind CSS

## Commands
\`\`\`bash
npm install
npm run dev
\`\`\`
`);

  return files;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

const GENERATORS: Record<ProjectType, (opts: ScaffoldOptions) => Map<string, string>> = {
  react: generateReactProject,
  nextjs: generateNextProject,
  node: generateNodeProject,
  python: generatePythonProject,
  game: generateGameProject,
};

export async function generateProject(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const generator = GENERATORS[opts.projectType];
  if (!generator) throw new Error(`Unknown project type: ${opts.projectType}`);

  const files = generator(opts);
  const zip = new JSZip();
  files.forEach((content, path) => zip.file(path, content));
  const blob = await zip.generateAsync({ type: 'blob' });

  return {
    files,
    blob,
    fileCount: files.size,
    projectType: opts.projectType,
  };
}

/**
 * Trigger browser download of the generated ZIP
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
