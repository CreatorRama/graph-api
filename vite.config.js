import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv'; // Use import * as syntax for CommonJS compatibility

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  plugins: [react()],
  server: process.env.NODE_ENV === 'development' ? {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
      passphrase: 'Aman@1112@6307'
    }
  } : undefined,
  build: {
    outDir: 'dist'
  },
  define: {
    'process.env': process.env // Pass all environment variables to your app
  }
});
