<div align="center">

# 🇻🇳 越南语拼读

**完全的离线越南语拼读学习工具 —— 装进手机，随时练。**

单页 PWA · 无需安装包 · 无后端 · 断网可用

[**▶ 在线体验**](https://c53dddc3e414491392a5ac428a28c759.app.workbuddy.link/) · [功能](#功能) · [技术](#技术实现) · [本地运行](#本地运行)

</div>

---

## 这是什么

一个把越南语**拼读规则**做成可交互练习的网页应用。

越南语的难点不在词汇量，而在**拼读系统**：12 个元音、27 个辅音、6 个声调、8 种后辅音收尾，组合规则复杂，光看文字说明很难记住。

这个工具把这些拆成可以**点着听、跟着读**的模块，并且把 420 段 MP3 全部内置，**完全离线**。

## 功能

| 模块 | 内容 |
|---|---|
| 🔤 **字母** | 元音 12 个、辅音 27 个，点击播放标准发音 |
| 🔗 **拼读** | 辅音 + 元音组合练习，如 `bờ...a...ba`，实时显示「辅音 / 元音 / 声调」拆解 |
| 🎵 **声调** | 6 个声调对比练习 |
| 📎 **后辅音** | 8 种收尾（-m -p -n -t -nh -ch -ng -c）组合 |
| 🔍 **辨音** | 易混淆音节对比训练 |
| ⭐ **收藏** | 收藏难记的音节，数据存本地 |

- 🎲 随机抽题
- 📴 完全离线（音频内置，不依赖网络）
- 📱 可添加到主屏幕，全屏运行

## 技术实现

| 项 | 说明 |
|---|---|
| 形态 | PWA（Progressive Web App） |
| 栈 | 纯 HTML + JavaScript，**无框架、无构建、无后端** |
| 主文件 | `index.html`（单文件，样式与逻辑内联，约 3.6 MB） |
| 音频 | `audio/` 下 420 个 MP3（约 2.5 MB），按拼读规则系统编号 |
| 映射 | `audio_mapping.json` —— 音节文本 → 音频文件 |
| 离线 | `sw.js`（Service Worker）缓存应用外壳 |

```
viet-spelling1/
├── index.html            主应用（单文件）
├── audio/                420 个 MP3 发音
├── audio_mapping.json    音节 → 音频 映射表
├── manifest.json         PWA 清单
├── sw.js                 Service Worker
└── icons/                应用图标（192 / 512 / apple-touch）
```

## 本地运行

因为是纯静态文件，任意静态服务器即可：

```bash
git clone https://github.com/Sunnyman3647590/viet-spelling1.git
cd viet-spelling1
python -m http.server 8080
# 打开 http://localhost:8080
```

> 不要直接双击 `index.html` 用 `file://` 打开——Service Worker 和音频在 `file://` 下会被浏览器限制。

## 开发中踩过的坑

这部分记录下来，给后来者省时间。

### 1. iOS 上完全没有声音

**现象**：桌面浏览器正常，iPhone Safari 里点任何音节都静音。

**原因**：`sw.js` 拦截了所有同源 GET 请求。iOS 播放 `<audio>` 时，浏览器会发 **Range 请求**并期望服务器返回 **206 Partial Content**；Service Worker 一旦拦截并改写响应，iOS 就拒绝播放。

**解法**：让媒体请求绕过 Service Worker，交给浏览器原生处理。

```js
// 音频/媒体请求不拦截，交给浏览器原生处理
if (/\.(mp3|wav|ogg|m4a|mp4|webm)$/i.test(pathname)) return;
```

### 2. 「改了代码，手机上没变化」

**现象**：改了逻辑并部署，桌面刷新就生效，手机怎么刷都是旧版。

**原因**：Service Worker 缓存优先策略，配合手机端的强缓存。

**解法**：改成**网络优先**——在线时总是拉最新资源并回写缓存，只有离线时才读缓存。

```js
fetch(e.request).then(resp => {
  const cp = resp.clone();
  caches.open(CACHE).then(c => c.put(e.request, cp));
  return resp;
}).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
```

### 3. 拼读要拆开播

音节不能只播一个整音——初学者需要听到 `bờ` → `a` → `ba` 的拼合过程。所以拼读模块是**分段播放**，而不是单段回放。

## License

[MIT](./LICENSE)