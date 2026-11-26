# CI：让每次提交自动跑回归测试

仓库自带零依赖测试 `tools/smoke-test.mjs`（61 项检查，含 7 个结局的真实通关）。CI 配置已写好，存放在 `ci/smoke.yml`，需要一次手动启用——原因是写入 `.github/workflows/` 必须使用带 `workflow` 权限的 token，普通 token 会被 GitHub 拒绝（403）。

## 启用方式（二选一）

### A. 网页一键新建（推荐，手机上也能做）

1. 打开：<https://github.com/wang-sunyang/deep-space-echoes/new/main/.github/workflows>
2. 文件名填 `smoke.yml`
3. 把 `ci/smoke.yml` 的内容整段粘贴进去
4. Commit changes，选 `main` 分支

提交后立刻会触发一次，之后每次 push / PR 都会跑。

### B. 本地用有 workflow 权限的 token 推

```bash
git clone https://github.com/wang-sunyang/deep-space-echoes.git
cd deep-space-echoes
mkdir -p .github/workflows
cp ci/smoke.yml .github/workflows/smoke.yml
git add .github/workflows/smoke.yml
git commit -m "ci: add regression workflow"
git push
```

## 它会做什么

| 步骤 | 说明 |
|---|---|
| checkout + setup-node 22 | 只用系统 node，不装任何 npm 包 |
| `node tools/smoke-test.mjs --json` | 失败即非零退出，PR 变红 |
| 上传 `smoke-report.json` | 保留 14 天，失败时可直接下载看哪一项挂了 |

耗时约 20 秒，主要开销是 7 个结局的通关模拟。

## 本地等价命令

```bash
node tools/smoke-test.mjs          # 全量，exit 0 表示全绿
node tools/smoke-test.mjs --quick  # 只跑静态检查，1 秒内
node tools/smoke-test.mjs --json   # 机器可读，给 CI 用
```

## 为什么值得留着

这个测试抓到过一次真实问题：第三章「谈判」需要 `en>=35`，但任何路线的能量上限只有 31，该结局在线上锁死了三周没人发现。测试用资源感知的路线规划 + 逐回合战斗模拟，能在改剧情时第一时间报出这类不可达路径。
