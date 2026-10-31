// Bridge file in case Render executes from 'scripts' path
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Switch working directory to server directory so relative paths and .env work seamlessly
process.chdir(path.resolve(__dirname, '../../server'));

import('../../server/src/index.js');

