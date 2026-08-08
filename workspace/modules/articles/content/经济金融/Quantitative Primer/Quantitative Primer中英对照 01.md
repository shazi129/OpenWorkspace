---
create: 2026-04-26 21:52:00
tags: Quantitative,投资
---

# 量化投研入门手册（Quantitative Primer）· 中英对照版 01


> **原书**：*Quantitative Primer — Everything you wanted to know about quant\* (\*But were too afraid to ask)*
> **出版方**：BofA Global Research（美银全球研究部门）· 2023 年 6 月 26 日
> **原书页数**：312 页
>
> 本译本采用「每段先英文原文，紧跟中文译文」的对照排版，专业术语在首次出现时给出中英对照，之后仅用中文。

---

# 第 1 页 · 封面

## 封面标题

**Quantitative Primer**
**量化投研入门手册**

*Everything you wanted to know about quant\**
*关于量化，你一直想了解的一切\**

**Quantitative Strategy**
**量化策略**

\**But were too afraid to ask*
\**却始终不好意思开口问的*

---

## 内容摘要

In our fourteenth edition of the US Quantitative Primer, we include performance of 70+ factors over a time period of ~40 years, over which Cash Flow-based valuation factors have been the best performers to remind readers that valuation matters and that cash is king. We outline the proprietary framework critical to our portfolio strategy work and highlight trends and topics in the quantitative industry.

在本次第十四版《美国量化投研入门手册》中，我们回顾了 70 余个因子在近约 40 年里的表现。期间，基于现金流的估值因子表现最为出色——再次提醒读者：**估值至关重要，现金为王**。报告还系统梳理了我们用于组合策略研究的自有分析框架，并着重讨论了量化行业当下的趋势与热点。

---

### A generation of investors trained on "price predicts price"
### 被"以价测价"训练出来的一代投资者

Most investors have seen a period during which momentum and technical factors have driven the largest gains. But outperformance of price momentum factors was likely driven by a liquidity-fueled multi-decade period of falling interest rates, globalization and central bank stimulus that resulted in high serial correlation across price returns. Prior to the Global Financial Crisis (GFC), valuation was a far better signal than using past price returns to predict future price returns.

当下多数投资者都经历过那样一段日子——动量因子和技术因子贡献了最大的收益。但价格动量因子之所以能持续跑赢，很可能是拜那段长达数十年、由流动性驱动的特殊宏观环境所赐：利率持续下行、全球化推进、各国央行反复刺激，使得价格回报之间呈现出很高的序列相关性。而在 2008 年全球金融危机（GFC）之前，**估值**作为选股信号的有效性，远胜于用历史涨跌预测未来涨跌。

<details>
<summary>📖 <b>术语解释：动量因子 / 技术因子</b></summary>

- **动量因子（Momentum Factor）**：一类建立在\"**强者恒强、弱者恒弱**\"经验规律上的选股信号。核心逻辑是——**过去一段时期（通常是 3–12 个月）涨得多的股票，在随后的一段时期里倾向于继续跑赢；跌得多的则继续跑输**。常见构造方式是用股票过去 N 个月的累计回报率（多数研究取过去 12 个月但剔除最近 1 个月，即所谓 \"12M-1M\"，以规避短期反转效应）对股票池排序，买入前 10%（或前 20%）、做空后 10%。动量因子属于**价格类因子**，不依赖任何基本面数据（不看盈利、不看估值），因此实现成本极低、更新频率可以做到日级。其背后的行为金融学解释通常是**投资者反应不足（under-reaction）** 与**羊群效应**。

- **技术因子（Technical Factor）**：更宽泛的一类概念，指**一切仅基于价格和成交量（及其衍生量）** 构造的选股/择时信号，动量因子可视为其中最具代表性的子类。典型技术因子包括：
  - **均线类**：如 30 周/75 周均线比（30W/75W MA）、5 周/30 周均线比、股价相对 200 日均线的位置；
  - **趋势类**：各类周期的价格回报（3M、9M、11M、12M Price Return）；
  - **反转类**：12M & 1M Reversal（长线动量 + 短线反转组合）；
  - **量能类**：Most Active（成交最活跃）、Short Interest（空头兴趣）等。

  这些因子共同特点是**纯粹从\"量价\"中提取信息**，不涉及公司基本面。本报告后文的\"量化因子参考\"章节（Exhibits 796 / 798）对此有系统的分位业绩与 Sharpe 比率展示。

两者关系：**动量 ⊂ 技术**。动量是\"方向性趋势\"的度量，而技术因子还额外涵盖了均值回归、量能、波动率等多个维度。

</details>

---

### Surprising strategy for a downturn
### 下行期里一个反直觉的策略

Contrary to popular belief, secular growth doesn't outperform value during recessions or "Downturn" regimes. Deep value (Price to Book, Price to Sales) has lagged, but so have growth factors (EPS Momentum, High Long-term Growth, Long Equity Duration). Winners during downturns have one thing in common: cash (outperforming factors have been cash return factors, our DDM valuation factor, and free cash flow-oriented factors).

很多人想当然地以为\"经济一差，大家就该抱紧长期成长股\"，但事实恰恰相反：在**衰退**或我们定义的\"**下行期（Downturn）**\"，**成长股并不跑赢价值股**。一方面，**深度价值股**（低市净率、低市销率那类\"便宜货\"）确实表现拉胯；但另一方面，**成长类因子**（盈利动量、高长期增速、长久期权益）同样被市场抛弃——**两头都不讨好**。那么谁在下行期真正胜出？答案只有一个字——**现金**：真正跑赢的是三类东西——**能把现金回馈股东的公司**（高股息、高回购）、**我们自研的 DDM 股息贴现模型**（本身就以未来股息折现为锚），以及**一切围绕\"自由现金流\"构建的因子**。

<details>
<summary>📖 <b>术语解释（本段密集出现的基础概念）</b></summary>

**① 成长 vs. 价值（Growth vs. Value）**——最基础的两大投资风格：
- **价值股（Value）**：估值便宜的股票（**低市盈率、低市净率、低市销率**），通常是成熟行业里的\"老钱\"公司（银行、能源、工业）。买法就是\"买便宜货\"。
- **成长股（Growth）**：高增速预期的股票（**盈利增速高、营收增速高**），估值通常很贵（高 PE、高 PS），典型是科技、生物医药、创新消费。买法是\"买未来\"。
- **深度价值（Deep Value）**：**最极端便宜的那批**——往往便宜得\"有道理\"（行业衰退、公司困境），需要甄别真便宜还是价值陷阱。
- **长期/世俗成长（Secular Growth）**：\"不受经济周期影响\"的长期增长故事（如云计算、AI、电动车渗透率）。

**② 估值类因子**：
- **市净率（Price-to-Book, P/B）= 股价 / 每股净资产**。**衡量\"市场给每 1 元账面资产定价多少\"**，<1 代表股价低于清算价值——经典深度价值指标。
- **市销率（Price-to-Sales, P/S）= 总市值 / 年营收**。适合无盈利或亏损的公司估值（此时 P/E 失效），越低越便宜。
- **市盈率（Price-to-Earnings, P/E）= 股价 / 每股盈利**。最常用估值指标——\"回本需要多少年\"。
- **DDM（Dividend Discount Model，股息贴现模型）**：**把公司未来所有预期股息按贴现率折现到今天**，得到\"理论价值\"，再与市价比对判断高估/低估。核心公式：

  $$V_0 \;=\; \sum_{t=1}^{\infty} \frac{\text{DPS}_t}{(1+r)^t}$$

  其中 $V_0$ = 今天的每股内在价值；$\text{DPS}_t$ = 第 $t$ 年的预期每股股息；$r$ = 股权要求回报率（贴现率，相当于\"你持有这只股票要求每年赚多少才值\"）。直觉：**越远期的股息，被折现得越狠；$r$ 越高（风险越大），现值越小**。

  如果假设股息永续、以固定速度 $g$ 增长（$g < r$），可简化为经典的**戈登增长模型（Gordon Growth Model）**：

  $$V_0 \;=\; \frac{\text{DPS}_1}{r - g}$$

  这是最古老、最根本的股票估值模型之一。本报告作者把 DDM 作为\"BofA 自有估值因子\"之一——在下行期胜出说明**\"派真金白银股息的公司\"在坏日子里更抗跌**。

**③ 成长类因子**：
- **盈利动量（EPS Momentum / Earnings Momentum）**：**分析师预期 EPS 的上调速度** 或 **实际 EPS 的加速程度**。\"盈利在变好\"的股票倾向继续跑赢。
- **高长期增速（High Long-term Growth, LTG）**：分析师给出的 **未来 3–5 年盈利年化增速预期（LTG）** 最高的那批股票。
- **长久期权益（Long Equity Duration）**：类比债券久期概念。\"**现金流越集中在远期、估值越贵的成长股 = 长久期**\"——**对利率极度敏感，利率上行时受冲击最大**；反之利率下行它们暴涨（2020 年低利率养肥成长股的核心机制）。

**④ 衰退 / 下行（Recession / Downturn）**：
- **衰退（Recession）**：官方定义上 **连续 2 个季度 GDP 负增长**，或 NBER 委员会综合评估（失业率、工业产出、实际收入等）后宣布。历史上美股在衰退期平均下跌，但**通常在衰退结束前 3–6 个月触底回升**——这就是为什么\"等确认了才进场\"反而错过大反弹。
- **下行（Downturn Regime）**：BofA 自定义的\"宏观状态\"之一。他们将经济周期分成 **Early Cycle（早周期）→ Mid Cycle（中周期）→ Late Cycle（晚周期）→ Downturn（下行）→ Recovery（复苏）**，每一阶段对应不同的因子表现——**\"下行\"比 NBER 定义的衰退更宽泛**，包括经济动能显著转弱的阶段。

**⑤ 现金相关因子**：
- **自由现金流（Free Cash Flow, FCF）= 经营现金流 − 资本开支**。**公司在维持运营和投资后真正剩下的\"可自由支配的钱\"**——可用于派息、回购、还债、并购。FCF 不像 EPS 那样容易被会计操纵，被称为\"**最难造假的盈利**\"。
- **现金回报因子（Cash Return Factors）**：反映公司把现金回馈给股东的力度——包括**股息率、回购收益率、总股东回报率（= 股息率 + 回购收益率）**。在下行期，这些因子胜出背后的直觉是：**\"账上有真金白银、敢把钱还给你的公司\"比\"讲故事的成长股\"更安全**。

</details>

---

### An alternative route to alpha
### 另辟蹊径寻找阿尔法（Alternative Data 之路）

The quest for alpha has driven investors beyond traditional sources into the realm of alternative data that can provide insights into the future performance of financial markets on a timely basis. BofA Global Research uses a wide range of data like NLP-based sentiment trackers including news sentiment, BAC aggregated credit and debit card spending data, web scraping, geolocation data as well as proprietary surveys. Many are compiled on a monthly basis in the BofA Global Proprietary Signals report. See inside for more details.

对阿尔法的追逐，正推动投资者走出传统数据源，进入**另类数据（Alternative Data）**的疆域——这类数据能更及时地映射出金融市场未来的走向。美银全球研究部门用到的数据范围很广：基于自然语言处理（NLP）的情绪追踪器（含新闻情绪指标）、美国银行汇总的信用卡与借记卡消费数据、网页抓取数据、地理位置数据，以及自有问卷调查等。其中相当一部分会在每月发布的《美银全球自有信号》报告中集中呈现。详见正文。

<details>
<summary>📖 <b>术语解释：Alpha / Beta / 另类数据 / NLP</b></summary>

- **Alpha（阿尔法，α）**：**超越基准指数的那部分回报**——衡量基金经理或策略的\"**真实选股/择时本事**\"。数学上：`组合回报 = α + β × 市场回报 + 残差`，**α 是剔除市场影响后还剩下的超额回报**。例如某基金一年赚 15%，S&P 500 同期涨 10%、该基金贝塔为 1.0，那么 α ≈ 5%。**找到正 α 的来源，是主动投资的终极目标**。

- **Beta（贝塔，β）**：组合对市场的**敏感度**。β=1 表示跟大盘同涨同跌；β=1.5 表示大盘涨 1%、该股倾向涨 1.5%（也承担 1.5 倍下跌风险）；β=0.5 则相对\"抗跌\"。β 只是\"**跟车**\"的那部分回报，**没有 α 的基金 = 一个贵的指数基金**。

- **传统数据（Traditional Data）**：公司财报、分析师预期、宏观经济数据（GDP、CPI、PMI）、价量数据——**所有投资者都能看到的、同频的**数据源。传统数据的\"信息边际\"已被大量挖掘，越来越难产生 α。

- **另类数据（Alternative Data）**：不在传统数据范畴里的**任何能提前反映商业活动**的数据。典型来源：
  - **卫星图像**：统计某零售商停车场车流量，提前预判其财报销售；
  - **信用卡/借记卡消费数据**（本报告用的 BAC aggregated spending）：抢在公司披露季度销售前知晓消费走向；
  - **网页抓取（Web Scraping）**：从电商网站抓商品价格/库存/评论来预估销售；
  - **地理位置数据（Geolocation）**：匿名手机定位数据监测门店人流；
  - **问卷调查（Proprietary Surveys）**：机构自建的消费者/CEO/CFO 情绪调查。

- **NLP（Natural Language Processing，自然语言处理）**：让计算机读懂人类语言的 AI 技术。在量化里最常见用途是**情绪分析（Sentiment Analysis）**——机器扫描**新闻报道、财报电话会议纪要、分析师报告、社交媒体推文**，量化出\"正面/负面\"分值，作为选股或择时信号。GPT 类大模型出现后，NLP 类另类因子能力显著跃升。

</details>

---

### Quant quiz: debunking myths
### 量化小测验：戳破常见误区

It's a confusing time to be an investor – macro indicators are flashing mixed signals and a there are a multitude of crosscurrents. Here we address and debunk some of the common narratives we hear contributing to investor frustration. Myths include: "Bad breadth is bearish" (in years of mega-cap leadership since 1986, the market was up the subsequent year nearly 75% of the time), "Value underperforms during recessions," (Value has a 75% hit rate in recessions over the past 40 years)," and more.

眼下当投资者相当烧脑——宏观指标信号杂乱，各种相互抵触的力量同时作用于市场。本章逐一回应并戳破一些让投资者焦虑、却未必站得住脚的流行说法。比如：**"市场广度差 = 熊市"**（事实：自 1986 年以来，凡是出现大盘股领涨的年份，次年市场上涨的概率接近 75%）；**"价值股在衰退期跑输"**（事实：过去 40 年的每一轮衰退中，价值的胜率是 75%）；等等。

---

### Eyeballs shifting to the short-term
### 市场目光正在全面转向短期

One of today's greatest market inefficiencies may stem from the shift in capital toward shorter-term strategies and the scarcity of capital devoted to long-term, fundamental investing. Zero-day-to-expiry options, or "0DTEs" have surged and now account for 40-45% of total SPX option volume. Our work suggests that extending one's time horizon has been a reliable recipe for loss avoidance in US stocks.

当下最大的一类市场无效定价，很可能来自这样一个结构变化：资金正越来越向短线策略集中，而真正投入**长期、基本面**投资的资金反而变得稀缺。**当日到期期权（0DTE）** 近期成交激增，目前已占标普 500 指数（SPX）期权总成交量的 **40%–45%**。我们的研究表明，拉长投资期限，仍然是在美股里规避亏损最稳妥的一条路径。

<details>
<summary>📖 <b>术语解释：期权 / 0DTE / SPX / 无效定价</b></summary>

- **期权（Option）**：一份赋予买方\"在未来某个时点（**到期日**）、以某个价格（**行权价**）买入（Call，认购）或卖出（Put，认沽）标的资产\"权利的合约。**买方付出权利金、拥有权利而无义务；卖方收到权利金、承担义务**。期权是**杠杆工具**——用较少的权利金就能撬动大额名义敞口。

- **0DTE（Zero Days to Expiry，当日到期期权）**：**到期日就是当天**的期权。从 2022 年起 CBOE 把 SPX 期权扩展到\"每天到期\"，于是\"**买一张今天收盘就归零或翻倍的彩票**\"成为可能。
  - **为什么爆火**：零日期权**隐含波动率低、权利金便宜**，投机者可以用极少资金在盘中对\"今天涨跌\"下注；同时程序化做市商大量做空 0DTE 收权利金。
  - **为什么是\"短期化\"代表**：与 3 个月、1 年期权相比，0DTE 完全围绕\"**盘中 1–6 小时的走势**\"，与公司基本面毫无关系——资金极端**短期化**的象征。
  - **市场影响**：做市商对 0DTE 的 Gamma 对冲会**放大尾盘价格波动**，近年已成为 SPX 日内剧烈摆动的主要原因之一。

- **SPX**：**标普 500 指数**的行情代码。**S&P 500**（Standard & Poor's 500）是追踪美国 500 家最大上市公司的市值加权指数，是全球最有代表性的股票指数，也是美股最活跃的期权标的。

- **市场无效定价（Market Inefficiency）**：有效市场假说（EMH）认为\"**所有信息都已反映在价格里**\"，但现实中由于**认知偏差、资金流结构、短期化博弈**等因素，价格会偏离基本面价值——这些**偏离**就是\"无效定价\"。**量化投资的核心就是寻找并利用系统性的无效定价**。作者在这里的判断是：**资金越短期化，留给长期基本面投资的空间反而越大**——因为没人愿意等 3 年了，坚持等的人就能捡到便宜。

</details>

---

## 边栏信息

**26 June 2023** · **Quantitative Strategy** · **United States**
2023 年 6 月 26 日 · 量化策略 · 美国

**Savita Subramanian** — Equity & Quant Strategist, BofAS
Savita Subramanian —— 股票与量化策略师，美银证券（BofAS）
+1 646 855 3878 · savita.subramanian@bofa.com

*See Team Page for List of Analysts*
*完整分析师名单见团队页*

---

### What's inside
### 本书亮点

- **For Quants** — What's the crowded trade? We include the most and least popular quantitative strategies and trends in factor popularity over time.
  **给量化研究者**：**拥挤交易在哪里？** 本书汇总了最热门与最冷门的量化策略，以及各类因子"受欢迎程度"随时间的变迁。

- **For sector analysts** — Different fundamental signals work better within different groups, and we highlight the most predictive stock selection attributes within sectors.
  **给行业分析师**：不同的基本面信号在不同行业内的有效性差异很大——我们列出了**每个行业最具预测力的选股指标**。

- **For equity long-short investors** — Certain attributes may matter more for long-only investors, whereas others may be better long-short signals, so we include performance of factors on the long and short side.
  **给股票多空投资者**：有些因子对只做多的投资者更重要，另一些则更适合构建多空组合——本书分别给出了各因子在多头端与空头端的表现。

<details>
<summary>📖 <b>术语解释：多头 / 空头 / 多空组合</b></summary>

- **多头（Long）**：买入并持有一只股票，期待其上涨赚钱——这是绝大多数散户和公募基金做的事（\"**只做多**\"）。
- **空头（Short）**：**借入**一只股票、以当前价卖出，期待其下跌后再以更低价买回、归还——**做空赚股价下跌的钱**。空头需要支付借券费（Stock Loan Fee），存在**无限损失风险**（股价理论上可以涨到无穷大）。
- **多空组合（Long-Short Portfolio）**：**同时做多一篮子股票、做空另一篮子股票**。在量化里，最经典的做法是：把股票按某因子排序，**买入前 10%（或前 20%），做空后 10%（或后 20%）**——称为 \"**Q1-Q5 Spread**\" 或 \"**D1-D10 Spread**\"。
  - **好处**：剔除了整体市场涨跌的影响（\"**市场中性**\"），组合回报几乎**只反映因子本身的选股能力**，是评判一个因子\"真有效 vs. 只是搭上大盘便车\"的黄金标准。
  - **区别**：只做多组合关心\"前 Q1 能不能跑赢市场\"；多空组合关心\"前 Q1 能不能跑赢后 Q5\"。有些因子只在多头端赚钱（低估值股跑赢大盘），有些只在空头端赚钱（超高贝塔股跑输）——本书会分别给出两端的业绩。

</details>

- **For Growth & Value managers** — We include factor performance within the style benchmarks, and also assess the fundamental attributes and attractiveness of the benchmarks themselves over time.
  **给成长与价值型基金经理**：本书既给出因子在各风格基准指数内部的表现，也动态评估**这些基准指数本身**的基本面属性与吸引力。

- **For macro investors** — We include market timing indicators, as well as an analysis of factor performance vis a vis macro environments. We also include industry attributes over time.
  **给宏观投资者**：本书提供择时指标、不同宏观环境下的因子表现对比，以及各行业属性的历史演变。

---

## 页脚免责声明

Trading ideas and investment strategies discussed herein may give rise to significant risk and are not suitable for all investors. Investors should have experience in relevant markets and the financial resources to absorb any losses arising from applying these ideas or strategies.

本文涉及的交易思路与投资策略可能带来重大风险，并不适合所有投资者。读者应具备相关市场的投资经验，并拥有足够的财务承受能力，以消化因采纳这些思路或策略而可能产生的任何损失。

BofA Securities does and seeks to do business with issuers covered in its research reports. As a result, investors should be aware that the firm may have a conflict of interest that could affect the objectivity of this report. Investors should consider this report as only a single factor in making their investment decision.

美银证券（BofA Securities）与其研究报告覆盖的发行人之间存在业务往来，或正寻求建立此类业务关系。因此，投资者应注意：本公司可能存在利益冲突，这会影响本报告的客观性。读者在做投资决策时，应把本报告视为众多参考依据之一。

*Refer to important disclosures on page 310 to 311.*
*重要披露请见第 310—311 页。*