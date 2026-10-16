# Encore · 安可回忆

个人照片与音乐回忆网站，使用 GitHub Pages 托管。

访问：https://kkc-0925.github.io/ ，在首页进入 Revelation 回忆册。

- [Revelation](https://kkc-0925.github.io/example/)：保留原版 12 张照片与 5 首歌曲。

## 目录

- `index.html`、`home.css`：相册导航首页，支持桌面和手机。
- `example/`：Revelation 相册的页面、初始数据、样式和交互脚本。
- `example/media/`：19 张 JPEG 图片和 5 个 MP3 音频。

## 资源优化

JPEG 使用质量 80、渐进式编码；长边超过 1920 像素的图片等比例缩小。
MP3 转为 96 kbps，保持文件名、路径、声道数及采样率。
媒体总大小从 25,630,885 字节减少至 18,817,149 字节，约减少 26.6%。

## 本地预览与维护

在仓库根目录运行 `python -m http.server 8000`，打开 `http://localhost:8000/`。无需构建。
部署时请上传整个仓库。Revelation 保留 `example/` 地址及原浏览器存储标识。
更新相册照片、歌单和背景请编辑 `example/data.js`。
页面支持完整 HTML 副本及 JSON 备份导出。

页面内的编辑保存在当前浏览器中。需要保留编辑内容时，请使用网站提供的导出功能。
