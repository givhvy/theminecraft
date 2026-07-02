// Vercel Function: phục vụ API + WebSocket (Fluid compute, WS public beta)
// Export http.Server làm default — Vercel tự xử lý cả HTTP lẫn WS upgrade
import { server } from '../server/app.js';

export default server;
