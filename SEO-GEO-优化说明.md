# AI 审核平台官网 SEO / GEO 优化说明

更新时间：2026-11-13

## 本轮完成

### 技术 SEO

- 4 个可索引页面统一 `robots`、`canonical`、`hreflang="zh-CN"`
- 统一补全 Open Graph、Twitter Card、`og:image` 尺寸与 alt
- 404 设置为 `noindex,follow`
- 更新 `sitemap.xml`，仅包含首页、AI 能力、客户案例
- 更新 `robots.txt`，屏蔽预览图和旧交付包目录
- 更新 `site.webmanifest` 的语言、描述与图标用途
- 页面标题与描述按页面意图重新整理

### 结构化数据

4 个可索引页面加入 JSON-LD `@graph`：

- `Organization`：品牌、Logo、商务联系、`knowsAbout`
- `WebSite`：站点名称、语言、发布者
- `SoftwareApplication`：产品类别、运行环境、功能清单
- `WebPage`：页面标题、描述、主图、更新时间
- `BreadcrumbList`：首页到当前页的层级
- `DefinedTermSet`：首页定义「通过、不通过、证据不足、未执行、不适用」五态

### GEO / AI 搜索优化

- `llms.txt`：一句话回答、五态定义、核心原则、能力、关键事实、页面索引
- 首页 AI 证据链明确“五态 / 弃权 / 证据链”，并给出状态统计样例
- 统一使用「AI 审核平台」「五态结论」「证据链」「报告门禁」等稳定实体名称
- 4 个页面均有清晰 canonical、标题、描述与层级

## 上线前必须替换

- `ruleproof.example` 预览域名替换为正式域名
- 正式上线前按企业实际信息补充页脚资料
- `og-cover.png` 如更换，请同步更新所有页面的 `og:image`

## 验证

- 所有 JSON-LD 可解析
- 4 个页面标题、描述无重复
- 站内链接与 SVG 图标引用无缺失
- sitemap XML 可解析，4 个可索引页面全部覆盖
- 所有页面 H1 唯一
- 文件权限已统一为 644 / 755

## 文件说明

本包包含 `website/` 下全部官网源代码、样式、脚本、图标、预览图、SEO/GEO 文件与说明文档。`preview/` 为设计预览图，不是线上运行依赖；旧 `dist/` 交付包未包含在本包内。
