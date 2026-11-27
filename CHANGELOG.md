# Changelog

## v2.0.1 — 2026-11-27 — 可操作性修复（P0 / P1）

**阻断级修复**
- **桌面端步行卡死**：3D 步行场景原先只监听 `touchstart/touchmove/touchend`，桌面浏览器进入走廊后无法移动。现补 `pointerdown/pointermove/pointerup`（鼠标 / 触控笔，左半屏拖动前进、右半屏拖动环视），并把 `WASD` / 方向键在步行模式下路由为移动与转向（`↑↓` 前后、`←→` 转向），`Esc` 退出不变
- **键盘焦点误触隐藏按钮**：`focusables()` 原先只过滤 `disabled`，`display:none` 的隐藏选项仍可被回车选中。现统一按可见性过滤（`isShown()`）
- **主廊道三扇门不可回头**：舰桥 / 居住区 / 反应堆出口全部只回中央城区，第四扇「中央城区」门的 `flag:vb,flag:vh,flag:vr` 三旗永远无法同时为真。现上述节点均新增「沿原路返回主廊道」选项，中央门可正常开启

**逻辑与数值修复**
- **无人机战奖励双发**：`battle_drone1.winFx` 与胜利节点 `a1_drone_win.fx` 内容完全相同，`endBattleWin` 与 `showNode` 各发一次（能量 +50、备用电池 +2）。删除战斗节点重复的 `winFx`，奖励只发一次（+25 EN、+1 电池）
- **战斗贴图错配**：`startBattle` 用 `[n.id]` 查表，而剧情节点无 `id` 字段，导致三场战斗全部贴 `memories` 模型。改用战斗节点自身的 `id` 入参，并为 `battle_caretaker` 补登记
- **退出步行重复结算**：`exitWalk` 调 `showNode(WALK.back)` 会重放来源节点 `fx` 并再次 `stats.nodes++`（氧气被白扣）。`showNode` 新增静默模式，退出步行只恢复画面、不结算

**统计口径**
- 选项数 100 → 107（新增 7 条「返回主廊道」分支）
- 回归测试：63 项冒烟检查 + 23 项事件级探针全通过

## v2.0 — 2026-11-26 — Second chapter, offline install, accessibility

**内容扩展**
- 新增支线遭遇战「圣坛侧舱」：`e1_annex` 分支（扫描 −8 EN / 撬门 −8 HP / 退回），解锁隐藏舱室与 200 具遗体
- 新增第四场战斗「守墓体」：95 HP / 13 ATK，每 3 回合「墓土覆盖」（伤害 ×1.4 + 吸能 6）
- 新增结局分支与词条：`cx_caretaker`（守墓体）、成就 `gravedigger`（守墓人）、回声独白 `e1_annex_win`
- **两条可选结局分支**：`ending_keeper`「守墓人」（在支线侧舱选择留下，替两百具遗体守灯）、`ending_seed`「播种者」（持外公的罗盘在圣坛重写回响的核心）—— 结局数 7 → 9，成就 14 → 16
- 统计口径：73 节点（60 剧情）、9 结局、4 战斗、16 成就、17 词条、14 回声独白、100 个选项

**体验打磨**
- **PWA / 离线安装**：新增 `manifest.webmanifest`、`sw.js`（导航 network-first、静态资源 cache-first）、`assets/icon.svg` + 192/512 PNG，可添加到主屏幕并断网开玩
- **无障碍**：`prefers-reduced-motion` 全局降级动画、`prefers-contrast: more` 提高对比、按钮最小 44px 触控热区、键盘导航时显示 focus ring、回声区与提示条加 `aria-live` 播报、3D canvas 标记 `aria-hidden`
- **存档 v2**：新增 `SAVE_V=2` 与 `migrateSave()`，v1 老档（数组式 items、缺失 stats 字段）自动迁移并清理旧键，越界资源值钳制

**工程**
- 回归测试扩至 **63 项**：新增存档 v1→v2 迁移、越界钳制、service worker 语法与预缓存清单、manifest 链接、PWA 注册等检查
- 新增 `ci/smoke.yml`（GitHub Actions，20 秒跑完）与 `docs/CI.md` 启用说明 —— 因 token 缺 `workflow` 权限，需在网页手动落一次
- `PUBLISH.md` 重写为可直接复制的中英文发布文案（V2EX / Reddit / HN / itch.io）

## v1.9 — 2026-11-26 — Balance pass & regression harness
- **结局可达性修复**：第三章「谈判」需要 `en>=35`，但任何一条极限路线的能量上限只有 31，该结局实际锁死 → 门槛调至 25
- **最终战平衡**：「回响守卫」130 HP / 16 ATK / 每 3 回合吸能 10，在最优路线下也会弹尽必败 → 105 HP / 14 ATK / 每 4 回合吸能 6
- **叙事标记回报**：`saw_shadow` 解锁「拒绝者」词条、`log_full` 解锁「方舟」词条（此前只写不读）
- **零依赖回归测试** `tools/smoke-test.mjs`：内置 DOM/Audio/Canvas 桩，47 项检查，含 7 个结局的真实通关（资源感知路线规划 + 自动战斗）
- 修正 README：剧情节点 52（原 57）、体积 ~127 KB（原 70/87 KB）、真实 Pages 链接、成就 13（原 11）

## v1.0 — 2026-11-19 — First release
- 7,000-word original sci-fi story, 57 story nodes, 7 endings
- Resource system (O₂ / EN / HP), flags & conditional choices
- 3 turn-based battles, auto-save, ending gallery, sound effects

## v1.1 — Same day — 3D visuals
- From-scratch software 3D renderer on Canvas 2D (no WebGL): low-poly Firefly ship, rotating Eden ark, breathing sanctum, dream sea, danger scenes
- 3D battle models (drone / memories / guardian) with laser beams, explosions, shield rings and hit flashes
- Fixed: battle-loss death check blocking retry; battle node id lost on defeat

## v1.2 — Same day — Sound & battle depth
- Procedural WebAudio ambient soundtrack, per-scene modes (space / ark / sanctum / dream / danger / void)
- Enemy signature skills (burst fire, memory heal, memory flood with energy drain)
- Battle consumables (oxygen tank, spare battery) with pickups
- Chapter replay with auto-unlock

## v1.8 — 2026-11-26 — Fullscreen, settings & controller support
- One-tap fullscreen (HUD button + `F` key + gamepad Ⓧ) with automatic canvas re-layout on change
- Settings panel (HUD ⚙ / gamepad Ⓨ / `Esc`-menu): text speed, graphics quality (battery saver vs HD), screen shake, gamepad rumble — all persisted in localStorage
- Full gamepad navigation: D-pad + left stick to select, Ⓐ confirm, Ⓑ back, analog sticks for walkable scenes (move + look), connection status shown in settings
- Full keyboard support: ↑↓/←→ select, Enter/Space confirm, Esc back, `F` fullscreen, `M` mute, `1-9` quick-pick
- Screen shake feedback on player hits & explosions; haptic rumble on supported controllers

## v1.7 — 2026-11-26 — Journey stats & speedrun records
- Per-run stats on the ending screen: play time, nodes traversed, battles fought, items used
- Personal speedrun records per ending (stored locally), with "first arrival" and "new record" callouts
- Title screen now shows total voyages and cumulative play time
- Chinese README (README.zh-CN.md) + bilingual link in the English README
- First public release pushed to GitHub with Pages enabled

## v1.6 — 2026-11-26 — World bible & in-game Codex
- Full world bible in [docs/CODEX.md](docs/CODEX.md): 2079–2289 timeline, four factions, lens-jump physics ("three iron laws"), consciousness science, the Great Silence paradox, the Forefleet/Ark/Far Shore cosmology, terminology, and 7 future-story hooks
- In-game Codex: 16 lore entries unlocked as the story progresses (default entries + node-triggered unlocks), readable from the title screen
- Every number in the story is now traceable to the bible (5126 souls, 400 lifeboats, 48 hours, 214 refusers, 73,050 awakenings, 2000 distress calls)

## v1.5 — 2026-11-26 — Easter eggs & farewell walk
- Hidden chapter "Whispers of the Echo": tap the title 7 times on the title screen for a secret first-person tale told by the Echo itself
- New walkable scene "The Last Door": the "turn away" route now ends with a first-person walk down a dark corridor toward the glowing airlock
- 2 new achievements (13 total): "First Star" (crack the signal *and* be gentle to Aiden), "Whispers of the Stars" (finish the hidden chapter)
- Node effects can now unlock achievements directly (`ach` key)

## v1.4 — 2026-11-26 — Walkable 3D scenes
- Four playable first-person segments: the ark main corridor (choose doors by walking), the shadow chase, the sanctum gauntlet march, and the sunset pier walk toward grandfather
- First-person camera for the software renderer, touch controls (drag left half to move, right half to look), locked-door hints, per-scene ambient lighting
- Fixed: `flag:` condition prefix parsing (flags never matched before — conditional choices/doors now actually work)

## v1.3 — Same day — Differentiation & virality
- ✦ Echo Mode (New Game+): 13 hidden inner monologues revealed after any ending
- Captain's log: automatic decision journal + one-tap copy-paste recap for sharing
- Share cards: personalized 3:4 ending card generated in-browser (long-press to save)
- 11 achievements with a title-screen gallery
- Repository packaging: README, LICENSE, social preview image, publish playbook
