import fs from 'fs';
import path from 'path';

const PAGE_MAPPINGS = [
  { inDir: 'src/app', outName: 'HomePage', hasCss: true },
  { inDir: 'src/app/dashboard', outName: 'DashboardPage', hasCss: false },
  { inDir: 'src/app/dashboard/edit/[id]', outName: 'DashboardEditPage', hasCss: false },
  { inDir: 'src/app/register', outName: 'RegisterPage', hasCss: true },
  { inDir: 'src/app/register/tournament', outName: 'RegisterTournamentPage', hasCss: true },
  { inDir: 'src/app/tournament/[id]/apply', outName: 'TournamentApplyPage', hasCss: true },
  { inDir: 'src/app/tournament/[id]/edit', outName: 'TournamentEditPage', hasCss: false },
  { inDir: 'src/app/master', outName: 'MasterPage', hasCss: false },
  { inDir: 'src/app/admin/cleanup', outName: 'admin/AdminCleanupPage', hasCss: false },
  { inDir: 'src/app/admin/seed', outName: 'admin/AdminSeedPage', hasCss: false },
  { inDir: 'src/app/admin/players', outName: 'admin/AdminPlayersPage', hasCss: false },
  { inDir: 'src/app/admin/players/new', outName: 'admin/AdminPlayerNewPage', hasCss: false },
  { inDir: 'src/app/admin/players/[id]/edit', outName: 'admin/AdminPlayerEditPage', hasCss: false },
];

PAGE_MAPPINGS.forEach(({ inDir, outName, hasCss }) => {
  const tsxPath = path.join(inDir, 'page.tsx');
  const cssPath = path.join(inDir, 'page.css');
  const outDir = path.dirname(path.join('src/pages', outName));

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (fs.existsSync(tsxPath)) {
    let content = fs.readFileSync(tsxPath, 'utf8');

    // Remove "use client";
    content = content.replace(/"use client";?\n?/g, '');
    content = content.replace(/'use client';?\n?/g, '');

    // Replace Next.js router imports with React Router DOM
    content = content.replace(/import\s+\{\s*useRouter(?:,\s*useParams)?\s*\}\s+from\s+['"]next\/navigation['"]/g, "import { useNavigate, useParams } from 'react-router-dom'");
    content = content.replace(/import\s+\{\s*useParams(?:,\s*useRouter)?\s*\}\s+from\s+['"]next\/navigation['"]/g, "import { useParams, useNavigate } from 'react-router-dom'");
    content = content.replace(/import\s+\{\s*useRouter\s*\}\s+from\s+['"]next\/navigation['"]/g, "import { useNavigate } from 'react-router-dom'");
    content = content.replace(/import\s+\{\s*useParams\s*\}\s+from\s+['"]next\/navigation['"]/g, "import { useParams } from 'react-router-dom'");
    
    // Replace const router = useRouter() with const navigate = useNavigate()
    content = content.replace(/const\s+router\s*=\s*useRouter\(\)/g, "const navigate = useNavigate()");
    
    // Replace router.push(...) with navigate(...)
    content = content.replace(/router\.push\(/g, "navigate(");
    content = content.replace(/router\.replace\(/g, "navigate(");
    content = content.replace(/router\.back\(\)/g, "navigate(-1)");

    // Next.js Link replacement (basic approach)
    content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"]/g, "import { Link } from 'react-router-dom'");
    content = content.replace(/href=/g, "to="); // Quick hack for Link tag, assuming no standard <a href=>

    // Next.js Image replacement (if any) -> use img 
    content = content.replace(/import\s+Image\s+from\s+['"]next\/image['"]/g, "");
    content = content.replace(/<Image/g, "<img");

    // Replace CSS import
    if (hasCss) {
      content = content.replace(/import\s+['"]\.\/page\.css['"]/g, `import './${path.basename(outName)}.css'`);
      if (fs.existsSync(cssPath)) {
        fs.copyFileSync(cssPath, path.join('src/pages', `${outName}.css`));
      }
    }

    fs.writeFileSync(path.join('src/pages', `${outName}.tsx`), content);
    console.log(`Migrated: ${tsxPath} -> src/pages/${outName}.tsx`);
  } else {
    console.log(`Not found: ${tsxPath}`);
  }
});

console.log("Migration script complete.");
