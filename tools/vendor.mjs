import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendorDirectory = join(projectRoot, 'vendor');

mkdirSync(vendorDirectory, { recursive: true });

copyFileSync(
  join(projectRoot, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js'),
  join(vendorDirectory, 'supabase.js')
);

const qrcodeOutput = join(vendorDirectory, 'qrcode.js');
if (!existsSync(qrcodeOutput)) {
  await build({
    entryPoints: [join(projectRoot, 'node_modules', 'qrcode', 'lib', 'browser.js')],
    outfile: qrcodeOutput,
    bundle: true,
    format: 'iife',
    globalName: 'QRCode',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    legalComments: 'none'
  });
}

console.log('Librerie browser locali aggiornate in vendor/.');
