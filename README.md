# TheMinecraft

Minecraft clone full stack mức **indie production**: client **TypeScript + Three.js + Vite**, server **Node.js authoritative** (Express + WebSocket), test tự động bằng **Vitest**.

## Tính năng

### 🤖 AI Builder (phím B)
Chọn công trình — AI xây dần từng block trước mặt bạn, tự đổ móng trên địa hình dốc:
- 🏡 **Nhà hiện đại** — biệt thự 2 tầng kính + bê tông, full nội thất (sofa, TV, bếp, giường...), hồ bơi
- 🏠 Nhà gỗ · 🏰 Lâu đài · 🐉 Hầm ngục rồng · 🧙 Tháp phù thủy · 🔺 Kim tự tháp · 🌉 Cầu đá · 🗼 Hải đăng · 🐲 Tượng rồng

### 🛋️ 38 loại block + nội thất
Block tự nhiên, quặng theo độ sâu, bê tông trắng/xám/đen, sàn gỗ, và 14+ nội thất: kệ sách, bàn, ghế, giường, sofa, tủ lạnh, bếp lò, TV, đèn bàn, thảm, tranh, chậu hoa, tủ bếp, hàng rào. Nhấn **E** để gán vào hotbar.

### 🐴 Ngựa & 🛶 Thuyền
- Ngựa sinh tự nhiên trên đồng cỏ ban ngày — **chuột phải để cưỡi**, phi nước đại với tiếng vó ngựa, tự nhảy qua block, Shift để xuống
- Thuyền trong kho đồ — đặt lên mặt nước, chuột phải để chèo đi khắp hồ

### 🔊 Âm thanh đầy đủ (WebAudio procedural)
Bước chân theo chất liệu (đá/gỗ/vải/kim loại/kính...), nhảy/tiếp đất, bơi, phá/đặt block theo loại, kính vỡ leng keng, zombie rên, creeper xì, ngựa hí + vó ngựa, chèo thuyền, nổ, chim hót ban ngày, dế đêm, nhạc hiệu xây xong. Mỗi âm có pitch ngẫu nhiên nhẹ để nghe tự nhiên.

### 🌐 Server authoritative (world state)
- Server giữ toàn bộ block edits trong bộ nhớ, là nguồn sự thật duy nhất
- Client gửi từng edit qua **WebSocket**; server **validate** (id hợp lệ, trong giới hạn thế giới) rồi broadcast cho mọi client → mở 2 tab là thấy nhau xây realtime
- Lưu xuống `worlds/default.json` (debounce 3 giây); client fallback localStorage khi không có server
- Vật lý/mob hiện chạy client-side (bước tiếp theo nếu muốn multiplayer chống hack hoàn chỉnh)

### Đồ họa & sinh tồn
Bóng đổ realtime, ngày/đêm, ambient occlusion, mây, hạt; zombie + creeper, máu, sát thương rơi, 4 dụng cụ, TNT dây chuyền, bơi lội.

## Cấu trúc dự án

```
shared/            # logic thuần dùng chung client + server + tests
  config.ts        # hằng số
  blocks.ts        # 38 block + dụng cụ
  noise.ts         # sinh địa hình
  world.ts         # chunk, get/set block, edits
  physics.ts       # va chạm AABB
  structures.ts    # 9 công trình AI Builder
server/
  index.ts         # Express + WebSocket, validate & lưu world
client/
  index.html
  css/style.css
  src/             # 18 module game (THREE.js, UI, audio, mobs...)
tests/             # 63 test Vitest
```

## Phát triển

```bash
npm install
npm run dev        # backend :3000 + Vite dev :5173 (mở http://localhost:5173)
npm test           # chạy 63 test
npm run typecheck  # kiểm tra type TypeScript
npm run build      # build production vào dist/
npm start          # chạy production (serve dist/ + API + WS)
```

## Điều khiển

| Phím | Hành động |
|---|---|
| WASD | Di chuyển |
| Space | Nhảy / bơi lên |
| F | Bật/tắt bay |
| B | 🤖 AI Builder |
| E | Kho đồ (block, nội thất, thuyền, dụng cụ) |
| Giữ chuột trái | Phá block / tấn công / kích nổ TNT |
| Chuột phải | Đặt block · cưỡi ngựa 🐴 · lên thuyền 🛶 · đặt thuyền lên nước |
| Shift | Xuống ngựa/thuyền (hoặc bay xuống) |
| 1–9 / lăn chuột | Chọn ô hotbar |
| Esc | Tạm dừng |
