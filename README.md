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

### 4. ⭐ 五个音节的发音被读成了两个音节

**现象**：`ac` / `ec` / `ưc` / `uch` / `ưch` 听起来拖成了两个音（类似「a cờ」「u chờ」），其余 414 个音轨都正常。

**根因（语言学）**：越南语正字法规定，塞音韵尾 `-c` / `-ch` / `-p` / `-t` **只能配锐声（sắc）或重声（nặng）**，不存在平声形式。所以 `ac` 这种平声写法在越南语里本就不合法，TTS 会把它当作字母缩写来念，于是变成「a + cờ」两个音节。`oc` 恰好被容忍，这就是为什么只有这几个出错。

**诊断方法**：不能只看文件时长（TTS 会带很长的首尾静音），要看**裁掉静音后的纯语音时长**：

```bash
ffmpeg -i in.mp3 -af "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_silence=0.02:start_threshold=-40dB,areverse" -ar 24000 -ac 1 out.mp3
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp3
```

判据（本项目的实测基线）：

| | 纯语音时长 | 判定 |
|---|---|---|
| `oc`（正常） | 0.312s | 单音节 |
| `uc`（正常） | 0.264s | 单音节 |
| `ac`（错误） | 0.696s | **两个音节**（约 2.2 倍） |
| `uch`（错误） | 0.816s | **两个音节**（约 2.6 倍） |

**解法**：把 TTS 输入换成合法的锐声拼写，读音立刻正确，且音色与其余音轨一致：

| 音节 | 原输入（错） | 改正后 | 时长 |
|---|---|---|---|
| ac | `ac` ❌ | `ác` | 0.600s |
| ec | `ec` ❌ | `éc` | 0.600s |
| ưc | `ưc` ❌ | `ức` | 0.576s |
| uch | `uch` ❌ | `úch` | 0.528s |
| ưch | `ưch` ❌ | `ứch` | 0.576s |

> **扩充音频时的规则**：凡 `-c / -ch / -p / -t` 结尾的音节，喂给 TTS 的文本一律用锐声或重声拼写，不要用平声。

### 5. 音频换名才能绕开缓存

改好的音频如果**沿用原文件名**，GitHub Pages 与手机浏览器会按 URL 命中旧缓存，播放的还是错的那版（表现为「改了没生效」）。

音频请求刻意绕过了 Service Worker（见坑 1），所以只能靠**换文件名**解决：

```
0001_ac.mp3  →  0510_ac.mp3
```

每次修正音频都要连带重建依赖它的拼读音轨，并同步三处映射：`audio_mapping.json`、`spell_audio.json`、`index.html`。

### 6. 拼读音轨改为预合并

最初每次点拼读都要串行请求 3 个 MP3（`bờ` → `a` → `ba`），手机上有间隙和失败。现在改为**预先生成合并音轨**（段间留 0.18s），点一次只播一个文件：

- `audio/spell/` 下 391 条音轨，覆盖拼读表全部音节
- `index.html` 里的 `SPELL_AUDIO` 保存「音节 → 合并音轨」映射
- `speakSpelling()` 优先播合并音轨，未命中才回退逐段播放

## 音频生成参考

本项目音源为 **Google 翻译 TTS**（`vi` 语种）：

```bash
# 需代理（大陆直连不可达）
curl -x http://127.0.0.1:7890 \
  -A "Mozilla/5.0" \
  "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=%C3%A1c" \
  -o ac.mp3
```

输出为 24kHz / 单声道 / 64kbps，与现有音轨一致，**无需再转码**。

## License

[MIT](./LICENSE)