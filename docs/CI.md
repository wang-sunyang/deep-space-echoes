# CI：让每次提交自动跑回归测试

仓库自带零依赖测试 `tools/smoke-test.mjs`（63 项检查，含 9 个结局的真实通关）。CI 配置已写好，存放在 `ci/smoke.yml`，需要一次手动启用——原因是写入 `.github/workflows/` 必须使用带 `workflow` 权限的 token，普通 token 会被 GitHub 拒绝（403）。

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

耗时约 20 秒，主要开销是 9 个结局的通关模拟。

## 本地等价命令

```bash
node tools/smoke-test.mjs          # 全量，exit 0 表示全绿
node tools/smoke-test.mjs --quick  # 只跑静态检查，1 秒内
node tools/smoke-test.mjs --json   # 机器可读，给 CI 用
```

## 为什么值得留着

这个测试抓到过一次真实问题：第三章「谈判」需要 `en>=35`，但任何路线的能量上限只有 31，该结局在线上锁死了三周没人发现。测试用资源感知的路线规划 + 逐回合战斗模拟，能在改剧情时第一时间报出这类不可达路径。

## 无 git 环境发版：脚本推送 + Pages 重建核验

有时候手边没有 `git`（云端容器、精简镜像、别人的机器），但需要把一个已经改好的 `index.html` 推上去。GitHub 的 Git Data API 可以完整复刻一次提交，不需要本地仓库。

### 1. 准备文件

发版清单固定为四个：`index.html`、`CHANGELOG.md`、`README.md`、`README.zh-CN.md`。改完先在本地跑一遍：

```bash
node tools/smoke-test.mjs        # 必须 exit 0
node probe_fix.mjs               # 事件级探针
node probe_p1.mjs                # 战斗 / 存档行为探针
```

### 2. 凭据（不要贴进聊天窗口）

脚本按优先级取 token，任一即可：

| 方式 | 命令 |
|---|---|
| 家目录文件（推荐） | `echo 'ghp_xxx' > ~/.gh_token && chmod 600 ~/.gh_token` |
| 环境变量 | `GH_TOKEN=ghp_xxx node push_v202.mjs` |
| 工作目录文件 | `echo 'ghp_xxx' > ./.gh_token && chmod 600 ./.gh_token` |

脚本会打印凭据来源（只显示路径）、`GET /user` 校验账号，并在文件权限宽于 `600` 时警告。

### 3. 一次提交的四步

| 步骤 | 接口 | 说明 |
|---|---|---|
| 1 | `POST /git/blobs` | 每个文件 base64 上传，拿到 blob sha |
| 2 | `POST /git/trees`（`base_tree`= 父提交的 tree） | 只声明变更文件，其余文件自动继承 |
| 3 | `POST /git/commits`（`parents`=[父 sha]） | 得到新 commit sha |
| 4 | `PATCH /git/refs/heads/main`（`force:false`） | 快进更新分支；非快进会直接报错，不会覆盖历史 |

顺序不能颠倒：tree 依赖 blob，commit 依赖 tree，ref 依赖 commit。

### 4. Pages 重建核验

推送成功不等于线上更新，Pages 还要再构建一次（通常 15~60 秒）。用「体积 + 新特性关键词」双重比对，并加随机查询串绕开 CDN 缓存：

```bash
for i in 1 2 3 4 5 6; do
  sleep 15
  SZ=$(curl -s "https://wang-sunyang.github.io/deep-space-echoes/index.html?v=$RANDOM" | wc -c)
  M=$(curl -s "https://wang-sunyang.github.io/deep-space-echoes/index.html?v=$RANDOM" | grep -c "本次新增的关键词")
  echo "try$i size=$SZ marker=$M"
  [ "$M" -gt 0 ] && break
done
curl -s "https://api.github.com/repos/wang-sunyang/deep-space-echoes/commits?per_page=1"   # 确认 HEAD
```

体积与本地 `wc -c index.html` 一致、关键词命中数 > 0，才算真正上线。

### 5. 收尾

```bash
rm -f ~/.gh_token ./.gh_token
```

若 token 曾以明文出现在聊天、日志或截图里，一律视为已泄露，去 GitHub → Settings → Developer settings → Personal access tokens 执行 Delete / Revoke，不要等它自然过期。

### 踩过的坑

- **`403` 不一定是权限不足**：往 `.github/workflows/` 写入时，缺 `workflow` 权限的 token 会被 GitHub 回 `404`，很容易误判成路径写错。先看 token 权限，再怀疑路径。
- **`force:false` 是护栏**：别为了「推上去」改成 `force:true`，那会静默丢掉别人（或未来的你）的提交。
- **Pages 缓存**：不带 `?v=` 的 `curl` 可能拿到旧缓存，误判「没更新」。
- **先测后推**：树一旦动过，回滚也要走一遍 API；把 `smoke-test` 放在第 1 步最省事。
