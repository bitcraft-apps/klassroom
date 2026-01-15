import { parseVulcanXlsxFromBuffer } from '@klassroom/core/browser';
import './styles/main.css';

const app = document.getElementById('app');
if (app) {
  app.textContent = 'Klassroom';
}

// Re-export to verify @klassroom/core/browser bundles without Node.js code
export { parseVulcanXlsxFromBuffer };
