# AI 爬虫与检索入口抓取机制事实清单

> 检索日期：2026-09；用途：评估部署在 Vercel 的纯前端 Vue 3 SPA 站点（HSR Wiki，中文）对 AI 检索入口的可见性。
> 结论按「厂商官方文档原文」与「社区惯例/未证实」分层标注。

## 1. OpenAI 官方爬虫

以 [developers.openai.com/api/docs/bots.md](https://developers.openai.com/api/docs/bots.md) 为准，官方当前四个 UA：

- **OAI-SearchBot** —— **仅用于搜索**，决定站点能否出现在 ChatGPT 搜索答案中。禁止后「站点不会出现在 ChatGPT 搜索答案中，但仍可能作为导航链接出现」。官方建议在 robots.txt 允许它，并放行其公布的 IP 段（<https://openai.com/searchbot.json>）。读取 robots.txt 时会附加 `robots.txt;` 标记。
- **GPTBot** —— 用于**训练**生成式基础模型；禁止仅代表内容不得用于训练，不影响搜索收录。
- **ChatGPT-User** —— 由用户或 Custom GPT/GPT Actions 触发的**单次抓取**，官方明说「不做自动爬取；因为由用户发起，robots.txt 规则可能不适用」，且明确它**不决定内容是否进入 Search**。
- **OAI-AdsBot** —— 新出现，仅访问作为广告提交的落地页，数据不用于训练（<https://openai.com/adsbot.json>）。

**关键结论：「搜索」用 OAI-SearchBot，用户触发的「浏览/取页」用 ChatGPT-User，两者互不替代。** 禁止 OAI-SearchBot 的最坏后果只是失去搜索答案曝光（降级为导航链接）；禁止 ChatGPT-User 对自动索引影响有限，因为官方自认受 robots 约束不确定。官方文档**未列出**任何名为 `ChatGPT-Operator` 的 robots token —— 判为**未证实**（社群目录站的归类，非 OpenAI 官方）。

## 2. 其它主流 AI 检索方（robots.txt token）

| 厂商 | 自动索引/搜索 token | 用户触发 token | 训练 token |
|---|---|---|---|
| Perplexity | `PerplexityBot` | `Perplexity-User`（官方称「由用户请求，**通常忽略 robots.txt**」） | 无独立训练 token |
| Anthropic | `Claude-SearchBot` | `Claude-User` | `ClaudeBot` |
| Google | `Googlebot`（AI Overviews / Gemini grounding 都用它） | 用户触发类 fetcher | `Google-Extended`（仅 robots 控制 token，无独立 UA） |
| Microsoft | `bingbot` | — | — |
| Apple | `Applebot`（Siri/Spotlight） | — | `Applebot-Extended` |
| Meta | `meta-externalagent` | — | 同左 |
| Amazon | `Amazonbot` + `Amzn-SearchBot` | `Amzn-User` | `Amazonbot` |
| ByteDance | `Bytespider` | — | — |

- **Google-Extended ≠ AI Overviews**：Google 明确它只控制「Gemini 应用/Vertex AI 的训练与 grounding」，**不影响 Google Search 收录，也不作为排名信号**；AI Overviews 与 Gemini 的 Search grounding 走 `Googlebot`。禁用 Google-Extended 会连带影响未来 Gemini 训练与 grounding（<https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers>）。
- Anthropic 三 token 的分工见 <https://privacy.claude.com/en/articles/8896518>：禁 `ClaudeBot` = 排除出训练集；禁 `Claude-User` = 用户提问时无法取回你的内容；禁 `Claude-SearchBot` = 无法为搜索索引你的内容。**Anthropic 支持 `Crawl-delay`**，且声明尊重 robots 与「不绕过 CAPTCHA」。
- Amazon 的三 token 分工与「支持 `noarchive`/`noindex`/`none`、**不支持 `crawl-delay`**」见 <https://developer.amazon.com/en/amazonbot>。
- **`Bingbot` 与 Microsoft Copilot 的关系未获微软明确文档化**：Copilot 的内容来源一般认为是 Bing 索引，但微软未公开「Copilot 使用哪个 UA / 是否单独抓取」——判为**未证实**。
- `Applebot-Extended` 与 `Meta-ExternalAgent` 的官方 robots token 名称在 Apple/Meta 支持页与开发者文档中被引用，但本次未能取得可原文引用的稳定段落 —— 名称判为**基本可信**，用途细节**未证实**。

## 3. robots.txt 正确写法与误封坑

依据 [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) 与 [Google robots.txt 规范](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)：

- **字段名与 UA 值都不区分大小写**（`User-agent`/`user-agent` 等价；`googlebot/1.2`、`googlebot*` 均等价于 `googlebot`）；**路径值区分大小写**。
- **分组优先级**：命中具体 UA 组时，**`User-agent: *` 组被完全忽略、两者不合并**；同名多组会被合并成一组。组在文件中的顺序无关。`Sitemap` 等非 allow/disallow 记录**不终止组**。
- **Allow 覆盖规则**：冲突时取「路径最长/最具体」的规则；长度相同时 Google 取**更宽松**的一条（即 Allow 优先）。`/$` 只匹配根。
- **HTTP 状态语义**：5xx = 视为完全禁止（Google 先停抓 12 小时，随后 30 天内用缓存，最终按 404 处理）；4xx（除 429）= 视为无 robots.txt、**不限制抓取**；3xx 最多跟随 5 跳。
- **文件格式**：必须是 UTF-8、`text/plain`、位于根路径 `/robots.txt`；解析上限至少 500 KiB。
- **常见误封坑**：
  1. **Cloudflare**：2025-07-01 起对新建域**默认屏蔽 AI 爬虫**（<https://blog.cloudflare.com/declaring-your-aindependence-block-ai-bots-scrapers-and-crawlers-with-a-single-click/>；<https://www.technologyreview.com/2025/07/01/1119498/>）。若站点在 CF 后面，robots.txt 写「允许」也没用。
  2. **Vercel WAF**：存在一键 AI bot 托管规则集与 bot 挑战/Deployment Protection（<https://vercel.com/changelog/new-one-click-ai-bot-managed-ruleset>、<https://vercel.com/kb/guide/how-to-block-bots-openai-gptbot>、<https://vercel.com/docs/deployment-protection/automated-agent-access>）。**JS/验证码挑战会让无头爬虫直接抓取失败**。
  3. **官方 WAF 白名单写法**：Perplexity 建议同时匹配 UA（`PerplexityBot`/`Perplexity-User`）**与**官方 IP 段，并优先于封禁规则（<https://docs.perplexity.ai/docs/resources/perplexity-crawlers>）。
  4. **SPA 的 JS 渲染问题**：AI 爬虫基本不执行 JS；纯前端 SPA 若首屏 HTML 无正文，抓到的就是空壳 —— 这是本项目最实质的风险点（Google 有渲染能力，其余多数 AI 爬虫没有）。
  5. 用 IP 封禁替代 robots 会破坏爬虫读取 robots.txt 的能力，Anthropic 明确警告此法不可靠。

## 4. llms.txt 提案现状

- **规范**（[llmstxt.org](https://llmstxt.org/)，Jeremy Howard，2024-09 提出、2026-08 修订为 v2）：位于 `/llms.txt` 或任意子路径的 Markdown 文件；顺序为 **可选 BOM → H1 标题（唯一必填）→ blockquote 摘要 → 若干非标题 markdown 段 → 若干 H2 分节的链接列表**（每项形如 `【名称】（链接）` + 可选 `: 说明`）；约定用 `## Optional` 放可跳过的次要链接；可选配套 `llms-full.txt` 与 `.md` 页面版本（`rel="alternate" type="text/markdown"`、`rel="describedby"`）。
- **厂商是否承认消费它**：**没有任何 AI 厂商官方承认消费它**。OpenAI、Anthropic、Google 各自为自己的**开发者文档站**提供了 llms.txt（即「输出方」而非「消费方」），不构成承认。
- **有证据的负面结论**：Google 官方 AI 优化指南写明「你**不需要**创建新的机器可读文件、AI 文本文件或 Markdown 来出现在 Google Search（含其生成式 AI 能力中），因为 Google Search 本身不使用它们」，并称对 Google 而言 llms.txt「**无益也无害，因为 Google Search 忽略它**」（<https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>）。John Mueller 称 llms.txt 的发现/差异化用途是「死路」。SE Ranking 30 万域研究：50 个最常被 AI 引用的域名中**仅 1 个**有 llms.txt；OtterlyAI 日志审计：AI 爬虫流量中仅 **0.1%** 指向 `/llms.txt`（证据汇总：<https://github.com/agricidaniel/claude-seo/blob/main/skills/seo-geo/references/llmstxt-evidence.md>）。
- **唯一有实证价值的场景**：**编码代理/AI 编程工具**读取库文档时消费它（Mintlify 为托管文档站自动生成，Chrome Lighthouse 的 agentic-browsing 审计会检查它）。
- **定性**：llms.txt 目前是**社区惯例 + 未证实的未来期权**，不是 AI 搜索收录杠杆。对游戏数据 Wiki 这类非开发者文档站，收益属「零成本防御性」。

## 5. sitemap.xml 对 AI 抓取的实际作用

- **作用**：帮助爬虫发现 URL，是**提示而非保证**；不替代内链。Google、Bing 及主流搜索引擎都支持在 robots.txt 中用 `Sitemap:` 指令声明。
- **robots.txt 中的 Sitemap 指令**：字段名不区分大小写、值区分大小写；必须是**绝对 URL**（含协议与主机）；**与 user-agent 无关**，可放在文件任意位置，可声明任意多条（<https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec>；<https://www.sitemaps.org/protocol.html>）。
- **格式与 content-type**：sitemap 必须是 **UTF-8 编码的 XML**，根元素 `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`，`<loc>` 必填，**其余全部可选**；单文件上限 **50,000 URL / 50MB（未压缩）**；跨 host 提交需在目标 host 的 robots.txt 中反向声明。**协议本身未规定 HTTP `Content-Type`**；实务上 `application/xml` 与 `text/xml` 通用，`robots.txt` 则按 RFC 9309 必须是 `text/plain` —— 不要混用。
- **`lastmod`**：可选，须为 **W3C Datetime**（可省时间部分，如 `2005-01-01` 或 `2004-12-23T18:00:15+00:00`）；协议明确要求写**页面最后修改时间**，而非 sitemap 生成时间，且与服务器 `If-Modified-Since` 是两套独立信号。乱填 lastmod 会损信誉 —— 常见误用。
- `changefreq` / `priority` 官方均标注为 **hint，非命令**，且明确 priority **不影响跨站排名**。
- **未证实**：没有任何 AI 厂商文档说明其 AI 检索入口（ChatGPT Search / PerplexityBot / Claude-SearchBot）如何使用 sitemap 的 lastmod 做新鲜度加权。

## 6. 主动提交/收录入口

- **IndexNow**（<https://www.indexnow.org/>、<https://www.indexnow.org/documentation>、<https://www.indexnow.org/faq>）：需在域名根放 `{key}.txt` 校验所有权；GET 单条或 POST JSON 批量（≤10,000 URL/次）；200/202 表示已接收，**不保证索引**；提交计入抓取配额。
  - **参与方官方名单：Microsoft Bing、Naver、Seznam.cz、Yandex、Yep，以及 Amazon**（FAQ 列出 `indexnow.amazonbot.amazon` 端点）。**Google 未参与**。
  - **对 Bing/Copilot 是否有效**：对 **Bing 索引**有效（Bing 是参与方、有官方端点）；但**「IndexNow 能否直接影响 Microsoft Copilot 的回答/引用」未获微软官方明确说明** —— IndexNow FAQ 只泛称有助于「AI 驱动的搜索结果」的时效性，属**未证实**。官方同时建议 **IndexNow 管高频变更 + sitemap 管全量清单**配合使用。
- **Google Search Console**：Google 唯一的主动入口，含提交 sitemap 与「请求重新抓取」（<https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl>）。
- **Perplexity 收录申请**：**未找到官方提交入口**，官方支持页只有一般性支持表单。判为**未证实/不存在**。
- **OpenAI 提交入口**：**不存在**。OpenAI 官方爬虫文档只提供 robots.txt 控制（OAI-SearchBot/GPTBot）与 IP 段 JSON，无任何提交或申诉页面。要进入 ChatGPT 搜索，唯一官方路径是**允许 OAI-SearchBot 抓取**。

## 对本项目的三条可执行结论

1. **首屏必须在无 JS 情况下有中文正文与内链**，否则除 Googlebot 外几乎所有 AI 爬虫只能抓到空壳 —— 这是比 robots.txt 更决定性的因素。
2. **robots.txt 显式允许 `OAI-SearchBot`、`PerplexityBot`、`Claude-SearchBot`、`Googlebot`、`bingbot`，并声明 `Sitemap:`**；`Google-Extended` 可按训练偏好单独决策，不影响 Search。
3. **llms.txt 可低成本加上，但不要当作收录杠杆**；真正有主动效果的是 IndexNow（Bing 侧）与 GSC。

## 来源链接

- OpenAI 爬虫总览（权威）：<https://developers.openai.com/api/docs/bots.md>
- OpenAI 搜索/训练分离说明、IP 段：<https://openai.com/searchbot.json>、<https://openai.com/gptbot.json>、<https://openai.com/chatgpt-user.json>、<https://openai.com/adsbot.json>
- Perplexity 爬虫与 WAF 配置：<https://docs.perplexity.ai/docs/resources/perplexity-crawlers>
- Anthropic 爬虫与封锁方式：<https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler>、IP 列表 <https://claude.com/crawling/bots.json>
- Google 爬虫总览与 Google-Extended：<https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers>、<https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers>
- Google robots.txt 规范：<https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec>
- Google 生成式 AI 优化指南（含 llms.txt 表态）：<https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
- Google 重新抓取入口：<https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl>
- REP 标准：<https://www.rfc-editor.org/rfc/rfc9309.html>
- Sitemap 协议：<https://www.sitemaps.org/protocol.html>
- IndexNow：<https://www.indexnow.org/>、<https://www.indexnow.org/documentation>、<https://www.indexnow.org/faq>
- Amazon（Amazonbot / Amzn-SearchBot / Amzn-User）：<https://developer.amazon.com/en/amazonbot>
- Cloudflare 默认屏蔽 AI 爬虫：<https://blog.cloudflare.com/declaring-your-aindependence-block-ai-bots-scrapers-and-crawlers-with-a-single-click/>、<https://www.technologyreview.com/2025/07/01/1119498/cloudflare-will-now-by-default-block-ai-bots-from-crawling-its-clients-websites/>
- Vercel WAF / bot 规则集：<https://vercel.com/changelog/new-one-click-ai-bot-managed-ruleset>、<https://vercel.com/kb/guide/how-to-block-bots-openai-gptbot>、<https://vercel.com/docs/deployment-protection/automated-agent-access>
- llms.txt 规范：<https://llmstxt.org/>
- llms.txt 证据汇总（第三方，含引用出处）：<https://github.com/agricidaniel/claude-seo/blob/main/skills/seo-geo/references/llmstxt-evidence.md>
