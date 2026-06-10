# TheMinecraft

Minecraft clone full stack chạy trên trình duyệt — client Three.js (kiến trúc module ES) + server Node.js/Express.

## Tính năng

### 🤖 AI Builder
Nhấn **B** trong game, chọn công trình — AI sẽ xây dần từng block ngay trước mặt bạn (kèm nền móng tự động trên địa hình dốc):
- 🏠 Nhà gỗ · 🏰 Lâu đài · 🐉 Hầm ngục rồng (kho báu + tượng rồng obsidian) · 🧙 Tháp phù thủy
- 🔺 Kim tự tháp · 🌉 Cầu đá · 🗼 Hải đăng · 🐲 Tượng rồng khổng lồ

### Thế giới
- Địa hình vô hạn sinh ngẫu nhiên theo chunk (fBm noise): đồi núi, hồ nước, đỉnh tuyết
- 20 loại block, quặng sinh ngầm theo độ sâu (kim cương ở tầng đáy)
- Nước bơi được, TNT nổ dây chuyền

### Đồ họa
- Bóng đổ thời gian thực, chu kỳ ngày/đêm với bình minh/hoàng hôn, mây trôi
- Ambient occlusion per-vertex, tone mapping ACES, hiệu ứng hạt
- Texture pixel-art vẽ 100% bằng canvas

### Âm thanh (WebAudio procedural, không cần file)
- Bước chân theo chất liệu block, nhảy/tiếp đất, nước bắn
- Phá/đặt block theo loại (đá, gỗ, kính vỡ leng keng…)
- Zombie rên rỉ, creeper xì, nổ, trúng đòn, mob chết
- Chim hót ban ngày, dế kêu ban đêm, nhạc hiệu xây xong công trình

### Sinh tồn
- Zombie đuổi cắn, creeper nổ; máu 10 tim, sát thương rơi, hồi máu, hồi sinh
- Kiếm / cúp / rìu / xẻng — tốc độ phá và sát thương theo dụng cụ

### Full stack
- Server Express lưu thế giới vào `worlds/*.json`, client autosave 10 giây
- Fallback localStorage khi chạy không có server

## Cấu trúc dự án

```
server.js              # Express: static + API lưu/đọc thế giới
public/
  index.html           # shell HTML
  css/style.css        # toàn bộ style HUD/UI
  js/
    main.js            # vòng lặp chính, khởi động
    config.js          # hằng số game
    blocks.js          # định nghĩa block + dụng cụ
    noise.js           # noise sinh địa hình
    textures.js        # texture atlas canvas + icon
    audio.js           # toàn bộ âm thanh WebAudio
    world.js           # dữ liệu chunk, get/set block, edits
    meshing.js         # dựng mesh chunk (culling + AO)
    scene.js           # renderer, ánh sáng, ngày/đêm, mây
    physics.js         # va chạm AABB, di chuyển thực thể
    player.js          # người chơi, máu, hồi sinh
    controls.js        # bàn phím, chuột, pointer lock
    raycast.js         # raycast voxel DDA
    mining.js          # phá/đặt block, tấn công
    hand.js            # vật phẩm trên tay (view model)
    mobs.js            # zombie & creeper AI
    tnt.js             # TNT + vụ nổ
    particles.js       # hệ thống hạt
    structures.js      # bản thiết kế công trình AI Builder
    builder.js         # menu + thi công dần từng block
    ui.js              # hotbar, kho đồ, tim, overlay
    entities.js        # danh sách thực thể dùng chung
    save.js            # lưu/tải thế giới (server/localStorage)
```

## Chạy game

```bash
npm install
npm start
# mở http://localhost:3000
```

## Điều khiển

| Phím | Hành động |
|---|---|
| WASD | Di chuyển |
| Space | Nhảy / bơi lên |
| F | Bật/tắt bay |
| B | 🤖 AI Builder — chọn công trình để xây |
| E | Kho đồ |
| Giữ chuột trái | Phá block / tấn công mob / kích nổ TNT |
| Chuột phải | Đặt block |
| 1–9 / lăn chuột | Chọn ô hotbar |
| Esc | Tạm dừng |
