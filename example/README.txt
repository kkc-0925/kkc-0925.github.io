Encore · 安可回忆（拆分版）

来源：Encore-我的回忆-2026-10-16(6).html
保留：12 张个人照片、5 首歌曲、自定义背景、文字和现有交互。

目录：
  index.html         网页结构和入口
  style.css          页面样式及手机适配
  app.js             转盘、照片缩放、编辑和音乐功能
  data.js            初始照片文字、设置、歌单及媒体路径
  media/photos/      个人照片
  media/background/  自定义背景
  media/music/       音乐
  media/demo/        程序保留的默认示例图片

打开：双击 index.html 可以浏览照片和播放音乐；移动文件时须保留整个 website 文件夹。
编辑：页面内修改自动保存到当前浏览器，不会自动修改 data.js 或上传到服务器。
页面已移除下载副本、导出回忆、导入备份按钮及保存状态说明。
要永久修改部署目录，可以编辑 data.js。

部署：上传 website 整个目录，入口为 index.html。静态目录选 website（如仓库根目录就是此文件夹，则选 .）。无需安装依赖或构建。
本次只拆分本地文件，尚未发布到 Deno Deploy。

歌单文件：
  1. 夜的尽头-南昌实录 → media/music/song-01.mp3
  2. 倒流时间 → media/music/song-02.mp3
  3. 孤独 → media/music/song-03.mp3
  4. 透明 → media/music/song-04.mp3
  5. 倒数 → media/music/song-05.mp3
