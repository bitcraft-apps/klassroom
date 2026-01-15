import { parseVulcanXlsxFromBuffer } from '@klassroom/core/browser';
import { createFileUpload } from './components/file-upload.js';
import './styles/main.css';

const app = document.getElementById('app');
if (app) {
  createFileUpload(app, {
    onFileSelected: (file) => {
      console.log('File selected:', file.name, file.size);
    },
    onError: (message) => {
      console.error('Upload error:', message);
    },
  });
}

// Re-export to verify @klassroom/core/browser bundles without Node.js code
export { parseVulcanXlsxFromBuffer };
