import { app } from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`=================================================`);
  console.log(`🚀 PadosiPro Backend API is running on port ${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`🔐 Auth Endpoints: http://localhost:${config.port}/api/v1/auth`);
  console.log(`📋 Task Catalog:   http://localhost:${config.port}/api/v1/tasks/catalog`);
  console.log(`=================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
