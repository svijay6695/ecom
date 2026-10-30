import { spawn } from 'child_process';

console.log('\n======================================================');
console.log('🥜 STARTING FULL VR NUTS SUITE (Frontend + Server + Admin)');
console.log('======================================================\n');

const runProcess = (name, cmd, args, cwd) => {
  const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
  p.on('error', (err) => console.error(`[${name}] Error:`, err));
  return p;
};

// 1. Backend Server (Port 5001)
const server = runProcess('SERVER', 'npm', ['run', 'dev'], './server');

// 2. Admin App (Port 5174)
const admin = runProcess('ADMIN', 'npm', ['run', 'dev'], './admin');

// 3. Customer Frontend (Port 5173)
const client = runProcess('FRONTEND', 'npm', ['run', 'dev'], './frontend');

console.log('🌐 Services starting:');
console.log('👉 Customer Store: http://localhost:5173');
console.log('👉 Admin Portal:   http://localhost:5174');
console.log('👉 Backend API:    http://localhost:5001\n');

process.on('SIGINT', () => {
  server.kill();
  admin.kill();
  client.kill();
  process.exit();
});

