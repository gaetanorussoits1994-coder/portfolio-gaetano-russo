import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
if (output !== resolve(root, 'dist')) throw new Error('Unexpected build directory');
if (existsSync(output)) rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

function readEnvironment() {
  const values = { ...process.env };
  const localPath = join(root, '.env.local');
  if (!existsSync(localPath)) return values;
  readFileSync(localPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
  return values;
}

const files = [
  'index.html', 'blog.html', 'articolo1.html', 'articolo2.html', 'contact.html', 'contatti.html',
  'privacy.html', 'cookie-policy.html', 'trattamento-dati.html', 'favicon.svg', 'robots.txt',
  'sitemap.xml', 'style.css', 'Gaetano_Russo_CV.pdf'
];
const directories = ['admin', 'css', 'immagini', 'js', 'vendor', 'video'];

files.forEach((file) => copyFileSync(join(root, file), join(output, basename(file))));
directories.forEach((directory) => cpSync(join(root, directory), join(output, directory), { recursive: true }));

const env = readEnvironment();
const runtime = {
  supabaseUrl: env.SUPABASE_URL || '',
  supabaseAnonKey: env.SUPABASE_ANON_KEY || '',
  publicSiteUrl: env.PUBLIC_SITE_URL || '',
  emailJsPublicKey: env.PUBLIC_EMAILJS_PUBLIC_KEY || '',
  emailJsServiceId: env.PUBLIC_EMAILJS_SERVICE_ID || '',
  emailJsContactTemplateId: env.PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID || '',
  contactEmail: env.PUBLIC_CONTACT_EMAIL || ''
};
writeFileSync(join(output, 'runtime-config.js'), `window.PORTFOLIO_CONFIG = Object.freeze(${JSON.stringify(runtime)});\n`, 'utf8');

console.log(`Build locale creata in ${output}. Nessun file interno, SQL o .env è stato copiato.`);
