const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('VoiceTestingPanel')) {
  code = code.replace(
    'import NotFound from "./pages/NotFound";',
    'import NotFound from "./pages/NotFound";\nimport { VoiceTestingPanel } from "@/components/VoiceTestingPanel";'
  );

  code = code.replace(
    '<Sonner />',
    '<Sonner />\n      <VoiceTestingPanel />'
  );

  fs.writeFileSync('src/App.tsx', code);
}
