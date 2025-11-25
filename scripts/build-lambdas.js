const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Usage: node scripts/build-lambdas.js [staging|dev]
const env = process.argv[2] || 'staging';
const root = process.cwd();
const targetDir = path.join(root, 'terraform', 'envs', env);

if (!fs.existsSync(targetDir)) {
  console.error('Target terraform env dir does not exist:', targetDir);
  process.exit(1);
}

const lambdaNames = ['health', 'patients', 'createUser', 'analytics'];

function zipLambda(name) {
  const lambdaDir = path.join(root, 'lambda', name);
  const outPath = path.join(targetDir, `${name}.zip`);
  if (!fs.existsSync(lambdaDir)) {
    console.warn('Skipping missing lambda folder:', lambdaDir);
    return;
  }

  console.log(`Packaging lambda ${name} -> ${outPath}`);

  // Remove existing zip
  try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}

  if (process.platform === 'win32') {
    // Use PowerShell Compress-Archive for Windows
    const cmd = `powershell -Command "Compress-Archive -Force -Path '${lambdaDir}\\*' -DestinationPath '${outPath}'"`;
    execSync(cmd, { stdio: 'inherit' });
  } else {
    // Use zip on *nix
    const cmd = `zip -r '${outPath}' .`;
    execSync(cmd, { cwd: lambdaDir, stdio: 'inherit' });
  }
}

for (const name of lambdaNames) {
  zipLambda(name);
}

console.log('Done packaging lambdas for', env);
