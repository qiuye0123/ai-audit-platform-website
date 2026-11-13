# AI 审核平台 · 官网

可审计 AI 审核平台的静态多页官网，**纯静态、无构建依赖**，下载后即可本地预览或部署到任意静态主机 / GitHub Pages。

> 把文件、表格与邮件里的经验变成可执行、可复核的判断；通过、不通过、证据不足、未执行、不适用五态结论与原文证据链。

## 下载

- **一键下载部署包**：[AI审核平台-部署包-20261113.zip](AI审核平台-部署包-20261113.zip)（约 342 KB，含全部源码与说明文档）
- 或点击仓库右上角 **Code → Download ZIP** 获取整个仓库。
- 部署包 SHA-256：`a2e461349a9e8a067d4cf59df18f3e27408d027ea8b33698b2c5bf0f53396b44`

## 仓库内容

| 路径 | 说明 |
| --- | --- |
| `website/` | 官网全部源码：HTML、CSS、JS、图标、社交分享图与 SEO/GEO 文件 |
| `AI审核平台-部署包-20261113.zip` | 与 `website/` 同源的可下载部署包（含 `README.md`、`SEO-GEO-优化说明.md`） |
| `SEO-GEO-优化说明.md` | 技术 SEO、结构化数据与 GEO/AI 搜索优化说明 |

### 页面

- `website/index.html`：产品功能首页（痛点、执行流程与内嵌页面、平台架构、对比优势、超级 AI 规则引擎、预制规则类型库、AI 证据链、产品功能总表）
- `website/ai.html`：AI 能力（AI 架构、解析、本体、规则、智能体、JEV、RSI、AI 质量评测）
- `website/cases.html`：三个客户案例
- `website/404.html`：错误页

### 目录

- `website/assets/css`：全站样式
- `website/assets/js`：导航、渐入、执行轨迹、示意图与动效脚本
- `website/assets/img`：图标、favicon 与社交分享图
- `website/sitemap.xml`、`robots.txt`、`llms.txt`、`site.webmanifest`：抓取与 GEO 文件

## 本地预览

```bash
cd website
python3 -m http.server 8899
```

打开 <http://127.0.0.1:8899/>。也可直接用浏览器打开 `website/index.html`。

## 部署

- **GitHub Pages**：仓库 Settings → Pages，Source 选 `main` 分支、目录选 `/website`（或把 `website/` 内容放到根目录后选 `/`）。
- **Nginx / 任意静态主机**：将 `website/` 目录作为站点根目录即可，无需后端、无需构建。

## 上线前必须替换

- 预览域名 `ruleproof.example` 替换为正式域名（canonical、Open Graph、sitemap、hreflang 等）
- 按企业实际信息补充页脚资料与商务邮箱
- 如更换 `og-cover.png`，请同步更新所有页面的 `og:image`

详见 [SEO-GEO-优化说明.md](SEO-GEO-优化说明.md)。

## 说明

本仓库为官网前端静态资源，不含后端服务、模型密钥或任何凭证。