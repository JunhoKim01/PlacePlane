import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { floorPlanMiddleware } from './server/floor-plan.mjs';

export default defineConfig({
  plugins: [react(), {
    name: 'local-floor-plan-import',
    configureServer(server) { server.middlewares.use(floorPlanMiddleware()); },
  }],
  base: '/PlacePlane/',
});
