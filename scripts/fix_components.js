import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Next.js router imports -> React Router
  content = content.replace(/import\s+\{\s*useRouter(?:,\s*useParams)?\s*\}\s+from\s+['"]next\/navigation['"];?/g, "import { useNavigate } from 'react-router-dom';");
  
  // Link replacement
  content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"];?/g, "import { Link } from 'react-router-dom';");
  content = content.replace(/href=/g, "to=");

  // useRouter -> useNavigate
  content = content.replace(/const\s+router\s*=\s*useRouter\(\);?/g, "const navigate = useNavigate();");
  content = content.replace(/router\.push\(/g, "navigate(");
  content = content.replace(/router\.replace\(/g, "navigate(");
  content = content.replace(/router\.back\(\)/g, "navigate(-1)");

  // Fix custom CSS import in apply template
  content = content.replace(/import\s+['"]@\/app\/tournament\/\[id\]\/apply\/page\.css['"];?/g, "import '@/pages/TournamentApplyPage.css';");

  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${filePath}`);
}

const filesToUpdate = [
  'src/components/ui/AppHeader/AppHeader.tsx',
  'src/components/ui/TournamentApplicationTemplate/TournamentApplicationTemplate.tsx',
  'src/hooks/useTournamentData.ts'
];

filesToUpdate.forEach(replaceInFile);
console.log("Component/Hook dependencies updated.");
