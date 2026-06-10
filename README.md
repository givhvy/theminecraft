# TheMinecraft

Minecraft clone full stack chạy trên trình duyệt — client Three.js + server Node.js/Express.

## Tính năng

### Thế giới
- Địa hình vô hạn sinh ngẫu nhiên theo chunk (fBm noise): đồi núi, thung lũng, hồ nước, đỉnh tuyết
- 20 loại block: cỏ, đất, đá, gỗ, lá, cát, ván, kính, nước, đá cuội, gạch, cỏ tuyết, bedrock, quặng (than/sắt/vàng/kim cương), obsidian, đá phát sáng, TNT
- Quặng sinh ngầm theo độ sâu — kim cương chỉ có ở tầng đáy
- Nước bơi được, TNT nổ dây chuyền phá địa hình

### Đồ họa
- Ánh sáng mặt trời định hướng + bóng đổ thời gian thực (shadow map)
- Chu kỳ ngày/đêm với bình minh & hoàng hôn, mây trôi
- Ambient occlusion từng đỉnh (per-vertex AO)
- Hiệu ứng hạt khi phá block và khi nổ, tone mapping ACES
- Texture pixel-art vẽ 100% bằng canvas, không cần file ảnh

### Sinh tồn
- **Zombie**: tuần tra, đuổi theo và cắn người chơi
- **Creeper**: áp sát, xì rồi nổ banh đất 💥
- Hệ thống máu 10 tim, sát thương rơi, hồi máu tự động, màn hình hồi sinh
- Vũ khí & dụng cụ: kiếm (sát thương cao), cúp (đào đá nhanh), rìu (chặt gỗ), xẻng (xúc đất)
- Thời gian phá block phụ thuộc độ cứng và dụng cụ phù hợp
- Âm thanh tự sinh bằng WebAudio

### Full stack
- Server Express lưu thế giới vào file JSON (`worlds/`)
- Client autosave mỗi 10 giây; tự fallback về localStorage khi không có server

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
| F | Bật/tắt bay (Space/Shift lên/xuống) |
| Giữ chuột trái | Phá block / tấn công mob / kích nổ TNT |
| Chuột phải | Đặt block |
| E | Mở kho đồ (gán block/dụng cụ vào ô đang chọn) |
| 1–9 / lăn chuột | Chọn ô hotbar |
| Esc | Tạm dừng |
