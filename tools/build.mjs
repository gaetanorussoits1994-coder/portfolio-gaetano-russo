import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
if (output !== resolve(root, 'dist')) throw new Error('Unexpected build directory');
if (existsSync(output)) rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const files = [
  'index.html', 'blog.html', 'articolo1.html', 'articolo2.html', 'contact.html', 'contatti.html',
  'privacy.html', 'cookie-policy.html', 'trattamento-dati.html', 'favicon.svg', 'robots.txt',
  'sitemap.xml', 'style.css', 'Gaetano_Russo_CV.pdf'
];
const directories = ['admin', 'css', 'immagini', 'js', 'vendor', 'video'];

files.forEach((file) => copyFileSync(join(root, file), join(output, basename(file))));
directories.forEach((directory) => cpSync(join(root, directory), join(output, directory), { recursive: true }));

console.log(`Build locale creata in ${output}. La configurazione pubblica viene fornita da /api/public-config.`);
