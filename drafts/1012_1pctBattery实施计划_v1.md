# 1% Battery v0.1 实施计划

> 执行技能：superpowers:executing-plans；当前会话直接实施，完成后一次独立审查。

目标：把已批准的设计文档实现为电脑浏览器可玩的首版，并提交到用户指定GitHub仓库。
架构：纯TypeScript引擎生成确定性状态和日志，React展示，Ghost通过相同引擎独立运行，JSON可复现。
技术：React、TypeScript、Vite、Vitest；浏览器端无需外部API。
设计依据：1012_1pctBattery项目设计文档_v1.md。

## 全局约束

- 初始能量10，内部以0.1能量整数记账；时间单位为模拟秒。
- 发送耗能2+n、耗时5+5n；完整内容才送达，中断按实际进度扣费。
- 光信号10/20秒成本2/3；亮屏传达5秒成本1；纸笔20秒成本0。
- 首次窗口、光信号、安排和回联采用设计文档时间；双方共享世界，同时间比较。
- 成果V为0时S=0，否则S=11V+剩余能量；重复成果不累计。
- 只用用户批准的产品范围；原始草稿、memory、node_modules、构建缓存不上传。
- 用户已整体批准设计并要求开始；不为初版参数和常规执行选择再次停工询问。

## 审查重点

- 恰好关闭时完成、中断传输、耗尽能量以及等待中遇到新情况。
- Ghost时间对齐，不从自己的未来日志泄露信息。
- 刷新恢复和损坏/旧版本存档；导出后可重演。
- 成长必须获得同意，不能改变当前局或回看练习的统计。
- 同一内容重复操作和连续点击不能重复扣费/加分。

## 文件与接口

app/src/game/types.ts 定义 World、Actor、Action、LogEntry、Session、Profile。
world.ts: createWorld(seed: string, preset?: 'A'|'B'): World。
engine.ts: initialActor(): Actor; act(world: World, actor: Actor, action: Action): Actor; choices(world: World, actor: Actor): Choice[]。
ghost.ts: ghostAt(world: World, seconds: number, version: number): Actor; growthOffer(profile: Profile): boolean。
scoring.ts: summarize(actor: Actor): Summary; compare(player: Actor, ghost: Actor): Comparison。
replay.ts: createSession(world,version,practice): Session; step(session,action): Session; verifyExport(data): Session。
storage.ts: loadSession/storeSession/loadProfile/storeProfile; 版本不合或非法数据不加载，错误交给UI说明。
App.tsx / components: 开始、事件、收尾和结算；styles.css 管理一致的界面。
app/package.json等采用开发工具约定文件名，已在设计文档列为命名例外。

## 任务1：建立版本基线和纯规则引擎

- [ ] 初始化main，仅提交项目规则、已批准设计、计划与说明，标记v0.1；开发分支codex/v0.1。
- [ ] 配置Vite/TypeScript/Vitest，写引擎行为测试：批量4/15、单发3/10、t32中断耗3.4仅位置送达、等待0能耗、关闭边界与非法动作。
- [ ] 运行npm test，看见缺失行为导致失败；实现types/config/world/engine后重新运行通过。
- [ ] 验证固定世界和seed生成稳定，测试同状态同动作一致，未知字段/非有限数字拒绝。
- [ ] 提交引擎与测试。

## 任务2：Ghost、评分、回放与成长

- [ ] 先写案例A/B测试：玩家111/28，Ghost77/99；检查同刻Ghost部分成本、双方动作不影响世界。
- [ ] 先写评分边界和存档恢复测试：V0为0，除零显示不可用，坏存档拒绝，回放与导出一致。
- [ ] 实现ghost/scoring/replay/storage，运行npm test通过。
- [ ] 成长观察至少两次非练习短光成果，提案经用户同意后更新下局版本；测试拒绝、重复完成不累计和旧局不变。
- [ ] 提交策略、记录与评分。

## 任务3：完整界面和交互

- [ ] 编写浏览器流程检查或组件测试：案例A完整结束、刷新、对照、导出、同局回看；初版页面未实现时检查失败。
- [ ] 实现四类页面、操作成本、状态图、可展开日志、成长提案与禁用说明。
- [ ] 提供随机局和A/B固定案例；游戏模拟标识清楚；无网络API依赖。
- [ ] npm test与npm run build通过；用浏览器实际走完两个案例，查看桌面与窄屏，无错误。
- [ ] 更新README与实施记录，提交界面。

## 任务4：复核、版本与GitHub同步

- [ ] 独立审查规则、接口、隐私泄漏和演示流程；重要问题补回归测试后修复。
- [ ] 最终npm test、npm run build；记录实际结果，禁止把纸面算例充当测试。
- [ ] 版本0.1.0，保留开发前v0.1基线，成品另标v0.1.0；不覆盖既有标签。
- [ ] 拿到用户目标仓库后，检查仓库内容/权限，仅上传本项目源码和必要说明，不覆盖其他项目。
- [ ] 通过GitHub插件上传并读取确认远端文件；如目标或接口阻塞，交付本地可运行成果并明确缺项。
