# 📣 Publish & Promotion Playbook

Everything needed to launch **Echoes of Deep Space** and grow its GitHub presence. The repo is already fully prepared; follow the steps top to bottom.

## 1. Push to GitHub (5 minutes)

```bash
cd deep-space-echoes
git remote add origin https://github.com/<YOUR_NAME>/deep-space-echoes.git
git add .
git commit -m "v1.3: single-file sci-fi interactive fiction — 7 endings, software 3D, synthesized OST"
git branch -M main
git push -u origin main
```

## 2. Repo settings checklist

| Setting | Value |
|---|---|
| Description | Single-file sci-fi interactive fiction: 7 endings, software-rendered 3D, synthesized soundtrack. Zero dependencies. |
| Topics | `game` `html5` `canvas` `sci-fi` `interactive-fiction` `visual-novel` `single-file` `zero-dependency` `javascript` `procedural-audio` |
| Social preview | `assets/social-preview.png` (already in repo) |
| Pages | Settings → Pages → Branch: `main` / root → save. Game then lives at `https://<YOUR_NAME>.github.io/deep-space-echoes/` |
| License | MIT (already in repo) |

## 3. Launch posts (copy-adapt templates)

### Hacker News — Show HN
> **Show HN: Echoes of Deep Space — a sci-fi interactive fiction in one HTML file**
>
> 7 endings, ~70 KB, zero dependencies. It has a hand-written software 3D renderer (no WebGL), a soundtrack synthesized live with WebAudio (no audio files), and a New Game+ "Echo Mode" that reveals hidden monologues on a second playthrough. Beat an ending and it generates a share card of your journey.
> Playable instantly at: <Pages URL>

Post it **Thursday–Friday 08:00–12:00 UTC**. Reply to every comment for the first 2 hours — HN ranking rewards early engagement.

### Reddit — r/webdev & r/gamedev
> Title: I made an entire story game in a single HTML file — software 3D, synthesized soundtrack, 7 endings
> Body: play link, the "why single-file" angle (works offline, no build step, easy to audit), one-line tech summary, ending-share-card screenshot.

### V2EX — 分享创造 (Chinese community)
> 标题：一封迟到两百年的求救信 —— 单文件科幻互动小说《深空回响》（7 结局 / 手写 3D / 合成配乐）
> 正文：试玩链接（GitHub Pages）、中文剧情梗概、单文件零依赖的技术点、截图（结局分享卡）。

### itch.io (bonus distribution)
Upload the HTML5 build — itch gives you another "Play now" audience and a ratings loop. Link it from the README.

## 4. What makes it sticky (lean on these)

1. **Playable in one click** — Pages link in the first line of every post. Zero-friction demos convert to stars.
2. **The single-file story** — "an entire game in one HTML file" is a hook people retweet.
3. **Echo Mode** — New Game+ for a narrative game is rare; it gives reviewers a reason to play twice and mention it.
4. **Share cards** — every ending produces a personalized image; ask players to post theirs (use a hashtag like `#DeepSpaceEchoes`). This is the built-in viral loop.

## 5. Keep momentum (first 4 weeks)

- Week 1: launch + fix any issue filed.
- Week 2: add 1 new achievement + a hidden Easter-egg scene, cut a v1.4.
- Week 3: speedrun-friendly "chapter select stats" or a title-screen playtime counter; post the changelog on HN as a comment.
- Week 4: accept a community-contributed echo line (credits in README) — contributors become promoters.

Small weekly releases keep the repo in GitHub's "trending" candidate pool better than one big bang.
