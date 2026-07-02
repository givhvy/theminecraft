// Chạy local / self-host: lắng nghe cổng
import { server } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`TheMinecraft server (authoritative world) chạy tại http://localhost:${PORT}`);
});
