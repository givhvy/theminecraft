# TheMinecraft

Minecraft clone chạy trên trình duyệt, viết bằng Three.js.

## Tính năng

- Thế giới voxel vô hạn, sinh ngẫu nhiên theo chunk (fBm noise)
- Cây cối, bãi cát, địa hình đồi núi
- Đặt / phá block với raycast chính xác từng voxel
- Vật lý: trọng lực, nhảy, va chạm AABB, chế độ bay
- Hotbar 8 loại block, texture pixel-art vẽ thủ công bằng canvas

## Cách chơi

Mở `index.html` qua một HTTP server bất kỳ, ví dụ:

```bash
python -m http.server 8123
# rồi mở http://localhost:8123
```

| Phím | Hành động |
|---|---|
| WASD | Di chuyển |
| Space | Nhảy |
| F | Bật/tắt bay (Space/Shift lên/xuống) |
| Chuột trái | Phá block |
| Chuột phải | Đặt block |
| 1–8 / lăn chuột | Chọn block |
| Esc | Tạm dừng |
