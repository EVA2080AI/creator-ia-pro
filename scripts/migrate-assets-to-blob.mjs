// Mueve a Vercel Blob las imágenes que todavía están guardadas como data URI base64
// dentro de la fila de Postgres (así se guardaban antes de octubre de 2026: cuatro
// imágenes pesaban 6 MB en una sola respuesta de /api/assets).
//
//   node --env-file=.env.local scripts/migrate-assets-to-blob.mjs          (simulacro)
//   node --env-file=.env.local scripts/migrate-assets-to-blob.mjs --aplicar
//
// Es idempotente: solo toca filas cuyo asset_url empieza por "data:", y si una falla
// sigue con las demás. No borra nada: reemplaza el base64 por la URL de Blob.
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const aplicar = process.argv.includes("--aplicar");
const sql = neon(process.env.DATABASE_URL);

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Falta BLOB_READ_WRITE_TOKEN (npx vercel env pull .env.local)");
  process.exit(1);
}

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

const filas = await sql`
  SELECT id, user_id, type, octet_length(asset_url) AS bytes, asset_url
  FROM saved_asset
  WHERE asset_url LIKE 'data:%'
  ORDER BY octet_length(asset_url) DESC
`;

const total = filas.reduce((a, f) => a + Number(f.bytes), 0);
console.log(`${filas.length} imágenes incrustadas · ${(total / 1024 / 1024).toFixed(2)} MB en la base`);
if (!aplicar) {
  for (const f of filas) console.log(`  ${f.id}  ${(Number(f.bytes) / 1024).toFixed(0)} KB  ${f.type}`);
  console.log("\nSimulacro. Para aplicarlo de verdad: --aplicar");
  process.exit(0);
}

let migradas = 0;
let fallidas = 0;
for (const fila of filas) {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(fila.asset_url);
  if (!match) { console.log(`  ${fila.id}: no es un data URI base64, se salta`); fallidas++; continue; }
  const [, mime, base64] = match;
  const ext = EXT[mime.toLowerCase()];
  if (!ext) { console.log(`  ${fila.id}: tipo ${mime} no soportado, se salta`); fallidas++; continue; }

  try {
    const { url } = await put(`imagenes/${fila.user_id}/${fila.id}.${ext}`, Buffer.from(base64, "base64"), {
      access: "public",
      contentType: mime,
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    });
    await sql`UPDATE saved_asset SET asset_url = ${url} WHERE id = ${fila.id} AND asset_url LIKE 'data:%'`;
    console.log(`  ✓ ${fila.id}  ${(Number(fila.bytes) / 1024).toFixed(0)} KB → ${url.slice(0, 70)}…`);
    migradas++;
  } catch (err) {
    console.error(`  ✗ ${fila.id}:`, err.message);
    fallidas++;
  }
}

const [resto] = await sql`SELECT count(*)::int AS n, coalesce(sum(octet_length(asset_url)), 0)::bigint AS bytes FROM saved_asset WHERE asset_url LIKE 'data:%'`;
console.log(`\nMigradas: ${migradas} · fallidas: ${fallidas} · siguen incrustadas: ${resto.n} (${(Number(resto.bytes) / 1024 / 1024).toFixed(2)} MB)`);
