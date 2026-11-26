# 发布与推广手册

《深空回响》当前状态：已上线，可玩，可安装，可离线。

| 项 | 值 |
|---|---|
| 试玩地址 | https://wang-sunyang.github.io/deep-space-echoes/ |
| 仓库 | https://github.com/wang-sunyang/deep-space-echoes |
| 体量 | 单文件 138 KB / 60 个剧情节点 / 4 场战斗 / 9 结局 / 16 成就 / 17 词条 |
| 技术底牌 | 零依赖、零构建、手写软件 3D（无 WebGL）、WebAudio 实时合成配乐、PWA 可离线安装 |
| 授权 | MIT |

---

## 一、V2EX「分享创造」

标题（选一个）：

- 一封迟到两百年的求救信：单文件科幻互动小说《深空回响》（9 结局 / 手写 3D / 合成配乐）
- 我用一个 HTML 文件做了个 7 结局的科幻故事游戏，手写 3D 渲染，零依赖

正文：

> 2289 年，打捞船「萤火号」在比邻星轨道捡到一段信号。发信方是两百年前失踪的殖民方舟「伊甸园号」，船上 5126 人。
>
> 到了才发现，船上没有活人，却有 5126 个还在呼吸的梦、一个守了两百年不肯睡去的男孩，和一个不理解「死亡」为何物的古老意识。
>
> 试玩（手机可直接打开）：https://wang-sunyang.github.io/deep-space-echoes/
>
> 技术上想聊三点：
> 1. 整个游戏是**一个 HTML 文件**，138 KB，没有构建步骤、没有 npm、没有 CDN。断网也能玩，可以右键另存。
> 2. 3D 是**手写的软件渲染**：透视投影、背面剔除、画家算法、平面着色，全跑在 Canvas 2D 上，没有 WebGL。
> 3. 配乐是**实时合成的**：没有音频文件，振荡器 + 包络按场景实时生成。
>
> 另外它是个 PWA，可以「添加到主屏幕」，离线打开。
>
> 二周目有「回声模式」，同样的剧情会浮出角色没说完的独白。通关会生成一张旅途复盘卡。
>
> 源码：https://github.com/wang-sunyang/deep-space-echoes （MIT）
>
> 好奇的是：单文件游戏这条路，大家觉得是「极致的克制」还是「不必要的自虐」？我做的时候一度觉得是后者（笑）。

发帖时间：工作日 10:00-11:30 或 20:00-22:00。首条回复自己补一句「有 bug 或错字直接说，我改」，并在 2 小时内回完所有评论。

---

## 二、Reddit

### r/InteractiveFiction（首选，人群最准）

> **Title:** I wrote a 9-ending sci-fi interactive fiction that fits in one HTML file (138 KB, no libraries)
>
> **Body:**
> 2289. A salvage ship picks up a distress call from a colony ark that vanished two hundred years ago. The ark is intact. Nobody on board is alive — but 5,126 dreams are still running, a boy has been waiting 200 years without sleeping, and something old wants to talk.
>
> Play (works on mobile): https://wang-sunyang.github.io/deep-space-echoes/
>
> How it's built: one HTML file, 138 KB, zero dependencies, zero build step. Software 3D on Canvas 2D (no WebGL), soundtrack synthesized live with WebAudio (no audio files), installable as a PWA and fully playable offline.
>
> 9 endings, 4 turn-based battles, 16 achievements, a New Game+ "Echo Mode" that reveals hidden monologues, and a share card generated from your playthrough.
>
> Source (MIT): https://github.com/wang-sunyang/deep-space-echoes
>
> Happy to answer anything about the engine, the writing, or why I insisted on no dependencies.

## 三、Hacker News「Show HN」

> **Show HN: Echoes of Deep Space – a 9-ending story game in one HTML file**
>
> One 138 KB HTML file: software-rendered low-poly 3D on Canvas 2D (perspective projection, backface culling, painter's algorithm — no WebGL), a soundtrack synthesized at runtime with WebAudio, and a data-driven node graph with conditions, effects and flags.
>
> 60 story nodes, 4 turn-based battles, 9 endings, New Game+ dialogue layer, installable PWA that works offline.
>
> There's also a zero-dependency regression harness that boots the page in a hand-written DOM stub and plays all 9 endings to completion — it caught an ending that was mathematically unreachable (a gate at 35 energy on a route that caps at 31).
>
> Play: https://wang-sunyang.github.io/deep-space-echoes/
> Code: https://github.com/wang-sunyang/deep-space-echoes

发布窗口：UTC 周四至周五 08:00–12:00（北京时间 16:00–20:00）。前 2 小时必须盯评论。

---

## 四、itch.io

1. Create new project → Kind of project: **HTML**，勾选 "This file will be played in the browser"
2. Upload 一个 zip，里面是 `index.html` + `manifest.webmanifest` + `sw.js` + `assets/`
3. Embed 尺寸填 `720 × 1280`，勾选 Mobile friendly / Fullscreen button
4. 页面文案：

> **深空回响 / Echoes of Deep Space**
> A one-file sci-fi interactive fiction about a distress call that is two hundred years late.
> 9 endings · 4 battles · no dependencies · playable offline

5. Tags：`interactive-fiction` `sci-fi` `text-adventure` `html5` `single-file` `chinese`
6. 定价：Free，但开启 "Donate" 按钮

---

## 五、发布节奏

| 时间 | 动作 |
|---|---|
| D0 | V2EX + Reddit 同天发，HN 留到周四/周五 |
| D1–D3 | 回完所有评论；把高频问题整理进 README 的 FAQ |
| D7 | 发一条「上线一周，多少个国家的人通关了哪个结局」的数据帖（Pages 无统计，可让玩家在分享卡里自报） |
| D14 | 补 1 个隐藏彩蛋场景，发 v2.1，用 changelog 二次触达 |
| D30 | 收社区投稿的回声独白，署名进 README |

## 六、别做的事

- 不要去无关板块刷链接（会被 shadowban，得不偿失）
- 不要在标题里堆砌「免费」「神作」这类词
- 不要承诺更新时间表，做不到反而掉分
