import type { Question } from "../../types";

/**
 * 后期题库：余量留给谁。
 * 这一阶段的选项普遍更贵，逼玩家在「再多做一件」和「留一点给最后一下」之间选。
 */
export const LATE_EXTRA: Question[] = [
  {
    id: "l09",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "电量进入个位数百分比。每一次亮屏都能看见数字在跳。",
      "你看着电量条。它已经短到让你不敢随便点任何东西。",
    ],
    options: [
      {
        label: "把剩下的全押在一次完整发送上",
        detail: "一次说清全部。成不成，就这一下。",
        cost: 230,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 3, odds: 0.5, hint: "电够不够撑到发完，只有天知道" },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，再多的电也送不出去" },
          { key: "network", in: ["local"], points: 1, note: "局部网稳，这一押值得一试" },
        ],
      },
      {
        label: "分两次发，先短后长",
        detail: "稳妥。第一条几乎一定能出，第二条看命。",
        cost: 140,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
      },
      { label: "不发了，留着", detail: "不耗电。也许留着本身更有价值。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l10",
    stage: "late",
    tags: ["social", "medical"],
    prompt: [
      "有人已经不动了。而旁边还有人在等一个决定。",
      "资源只够再救一个。而这个选择，落在了你身上。",
    ],
    options: [
      {
        label: "把剩下的电用在通知伤者的位置",
        detail: "你替不能说话的人说话。这之后你就没有了。",
        cost: 160,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 2 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你自己也撑不了多久了" },
        ],
      },
      {
        label: "把设备交给别人，让他决定",
        detail: "不用电。从此这一局再没有你的操作。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "relay", points: 1 },
      },
      { label: "留给自己最后一下", detail: "不耗电。你也有自己的账要算。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l11",
    stage: "late",
    tags: ["light", "risk"],
    prompt: [
      "你听见头顶有钻头声。它停了一下，像是在判断。",
      "他们在犹豫这一铲往哪下。你要不要给他们一个明确的信号。",
    ],
    options: [
      {
        label: "把最后一点电换成一次强光",
        detail: "最亮的一下。之后彻底黑屏。",
        cost: 250,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天这一下完全看不见" },
          { key: "daylight", in: ["night", "dusk"], points: 1, note: "天暗着，这一下能穿透缝隙" },
        ],
      },
      {
        label: "用重物敲出急促的节奏",
        detail: "不用电。急促的节奏通常被理解为「这里有人」。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "disaster", in: ["earthquake"], points: -1, note: "敲得越急，越可能把结构敲塌" },
        ],
      },
      { label: "保持安静，别干扰他们判断", detail: "不耗电。也许他们比你想的更有把握。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l12",
    stage: "late",
    tags: ["screen", "nav"],
    prompt: [
      "救援让你描述你所在的空间。这个描述会决定他们怎么挖。",
      "一句话里藏着一个空间。说清楚，还是说简短。",
    ],
    options: [
      {
        label: "发一段详细描述，包含结构",
        detail: "内容长，发送久。但能让他们避开承重。",
        cost: 175,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["weak", "flicker"], points: -1, note: "弱网下长消息最容易断" },
        ],
      },
      {
        label: "只说深度和方位",
        detail: "便宜。够他们定位，不够他们避让。",
        cost: 70,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "让他们边挖边喊，你回应", detail: "不用电。慢，但准。", cost: 0, tags: ["voice", "nav"] },
    ],
  },
  {
    id: "l13",
    stage: "late",
    tags: ["social", "paper"],
    prompt: [
      "有件事你一直没说出口。现在不说，也许就没机会了。",
      "最后一点电，可以换成一条消息，也可以换成一句别的话。",
    ],
    options: [
      {
        label: "发给那个人",
        detail: "不图救援，只图说出口。这一下花掉你不少余量。",
        cost: 150,
        tags: ["screen", "social"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这句话送不到" },
        ],
      },
      {
        label: "写在纸上，留在身边",
        detail: "不用电。会跟着你被找到，也可能永远不被看到。",
        cost: 0,
        tags: ["paper"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "carry", in: ["pen"], points: 1, note: "有笔，写得清楚" },
          { key: "carry", in: ["none"], points: -1, note: "没笔，只能口述给旁边的人" },
        ],
      },
      { label: "不说了，留着电", detail: "不耗电。有些话也许本来就不该说。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l14",
    stage: "late",
    tags: ["medical", "light"],
    prompt: [
      "你的视线开始模糊。这可能是低血糖，也可能是别的。",
      "身体在关机。而手机也是。",
    ],
    options: [
      {
        label: "开手电找找有没有能吃能喝的",
        detail: "照着找最快。但你的体力也在流失。",
        cost: 85,
        tags: ["light", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "temp", in: ["freezing"], points: 1, note: "严寒下热量就是命" },
          { key: "daylight", in: ["day"], points: -1, note: "外头有光，不用开灯" },
        ],
      },
      {
        label: "省下电，原地保存体力",
        detail: "不用电。也许撑到被挖出来就够了。",
        cost: 0,
        tags: ["wait"],
      },
      {
        label: "告诉别人你快不行了",
        detail: "不用电。说出来，别人也许会优先救你。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你说不了太多话了" },
        ],
      },
    ],
  },
  {
    id: "l15",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "最后一格信号闪了一下。这可能是最后的机会，也可能什么都不是。",
      "要不要把剩下的全花在这一闪上。",
    ],
    options: [
      {
        label: "全押，把最要紧的推出去",
        detail: "孤注一掷。赢了就赢，输了就全输。",
        cost: 200,
        tags: ["screen", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "这一闪能不能撑住，谁也不敢说" },
        env: [
          { key: "network", in: ["local"], points: 1, note: "局部网还在，成功率偏高" },
          { key: "network", in: ["dead"], points: -2, note: "彻底断网，这一押必然落空" },
        ],
      },
      {
        label: "只发最短的一句，留一半",
        detail: "保守。至少还有第二次机会。",
        cost: 90,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不押，关机", detail: "不耗电。留到被挖出来那一刻。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l16",
    stage: "late",
    tags: ["social", "voice"],
    prompt: [
      "外面在喊：还有没有人。而你知道，还有。",
      "他们问的是「还有没有人」。你知道答案在另一堆瓦砾下面。",
    ],
    options: [
      {
        label: "替那边回应，说明还有人在",
        detail: "不用电。但救援的注意力会被分走。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "relay", points: 1 },
        env: [
          { key: "injury", in: ["bleeding", "fracture"], points: -1, note: "你喊不出那么大声" },
        ],
      },
      {
        label: "亮屏把那边的方位告诉他们",
        detail: "说得最清楚，但要花你这局最后一点电。",
        cost: 130,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，只能口述坐标" },
        ],
      },
      { label: "不提那边，先让救自己", detail: "不耗电。这是最真实的一种选择。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l17",
    stage: "late",
    tags: ["light", "screen"],
    prompt: [
      "你的手在抖，电量在掉，而外面的人需要一个持续的信号。",
      "持续信号最有用，也最耗电。这是最后一道算术题。",
    ],
    options: [
      {
        label: "设定屏幕常亮，撑到最后",
        detail: "把剩余全部变成光。之后你什么也做不了。",
        cost: 245,
        tags: ["screen", "light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天这块屏毫无意义" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里这块屏就是一盏灯" },
        ],
      },
      {
        label: "设定规律闪烁，留一点余地",
        detail: "闪烁比常亮省，也更像是人发的信号。",
        cost: 120,
        tags: ["light"],
        gain: { outcome: "light", points: 1 },
      },
      { label: "不设，手动控制到最后", detail: "不耗电在设置上，但你要一直盯着。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l18",
    stage: "late",
    tags: ["nav", "screen"],
    prompt: [
      "救援问了一个你答不上来的问题：你上方是什么。",
      "他们需要知道铲下去会碰到什么。而你不太确定。",
    ],
    options: [
      {
        label: "开手电照清头顶再答",
        detail: "答错了他们可能铲塌你。这一下值得花。",
        cost: 100,
        tags: ["light", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里" },
          { key: "disaster", in: ["earthquake", "avalanche"], points: 1, note: "这种结构最需要看清头顶" },
        ],
      },
      {
        label: "凭听觉和手感猜一个",
        detail: "不用电。猜错了后果自负。",
        cost: 0,
        tags: ["nav", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.45, hint: "猜对猜错，各一半" },
      },
      { label: "直接说不知道", detail: "不耗电。诚实也是一种答案。", cost: 0, tags: ["voice"] },
    ],
  },
  {
    id: "l19",
    stage: "late",
    tags: ["social", "screen"],
    prompt: [
      "你身边有个人一直在替你守着。现在轮到你替他了。",
      "有人把机会让给了你。要不要还回去。",
    ],
    options: [
      {
        label: "把剩下的电给他，让他发一条",
        detail: "你还回去。这一局从此与你无关。",
        cost: 180,
        tags: ["social"],
        gain: { outcome: "relay", points: 2 },
      },
      {
        label: "帮他发，但电只花一半",
        detail: "你还了一半。剩下的一半留着。",
        cost: 95,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 1 },
      },
      { label: "不还，留给自己", detail: "不耗电。也许你更需要。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l20",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "手机开始自动关闭后台。系统在替你做减法。",
      "最后这点电，系统也要来抢。你要不要抢回来。",
    ],
    options: [
      {
        label: "关掉一切，只留发送这一条路",
        detail: "一次设置，把所有余量集中到一件事上。",
        cost: 35,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
      {
        label: "不设，让它自己关",
        detail: "不用电。也许系统比你更会算。",
        cost: 0,
        tags: ["wait"],
      },
      {
        label: "趁还有电赶紧再发一条",
        detail: "抢在系统动手之前。这条发得仓促。",
        cost: 110,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 2, odds: 0.5, hint: "发出去没有，看这一下快不快" },
      },
    ],
  },
  {
    id: "l21",
    stage: "late",
    tags: ["paper", "social"],
    prompt: [
      "手机快没了。而你想留下的东西，也许本来就不该存在手机里。",
      "最后一道题：把要说的话，放在最耐用的地方。",
    ],
    options: [
      {
        label: "把关键信息刻在墙上",
        detail: "不用电。墙比手机活得久。",
        cost: 0,
        tags: ["paper"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "carry", in: ["pen", "torch"], points: 1, note: "有笔有光，刻得清楚" },
        ],
      },
      {
        label: "口述给身边的人，让他记住",
        detail: "不用电。记忆会失真，但人会出去。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "存进手机，赌它能撑到被找到",
        detail: "要花一次电写进去。赌的是手机比人先被找到。",
        cost: 60,
        tags: ["screen"],
        gain: { outcome: "brief", points: 1 },
      },
    ],
  },
  {
    id: "l22",
    stage: "late",
    tags: ["medical", "social"],
    prompt: [
      "有人需要两个人才能抬出去。而你只腾得出一只手。",
      "帮，还是不帮，在这个电量下是个算术问题。",
    ],
    options: [
      {
        label: "帮，把伤者往外挪",
        detail: "不用电。但你的力气是有限的。",
        cost: 0,
        tags: ["move", "social"],
        gain: { outcome: "relay", points: 1 },
        env: [
          { key: "injury", in: ["fracture", "bleeding"], points: -1, note: "你自己这个状态帮不上忙" },
        ],
      },
      {
        label: "用手电给外面指路，让他们来抬",
        detail: "用电换效率。这一下也许更快。",
        cost: 90,
        tags: ["light", "nav"],
        gain: { outcome: "relay", points: 1 },
        env: [
          { key: "daylight", in: ["day"], points: -1, note: "白天指路用不上光" },
        ],
      },
      { label: "不帮，先出去再说", detail: "不耗电。出去了才能叫人。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l23",
    stage: "late",
    tags: ["screen", "nav"],
    prompt: [
      "救援的声音在两个方向都有。你得分清哪个是冲你来的。",
      "两个方向都在响。选错，就意味着白等。",
    ],
    options: [
      {
        label: "开定位确认自己相对哪边更近",
        detail: "数据说话。代价是这一下亮屏。",
        cost: 105,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，定位不准" },
        ],
      },
      {
        label: "两边都喊，看哪边回应",
        detail: "不用电。也许两边都会回应。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "哪边会先回应你，不好说" },
      },
      { label: "不动，等他们挖到我", detail: "不耗电。挖到了自然就知道。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l24",
    stage: "late",
    tags: ["light", "voice"],
    prompt: [
      "光快没了，声音也快没了。你得选一样留到最后。",
      "最后一点余量，换成光，还是换成声。",
    ],
    options: [
      {
        label: "换成光，让它一直亮着",
        detail: "光更远。但也更快耗尽。",
        cost: 190,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["night", "dusk"], points: 1, note: "天暗着，光才有用" },
          { key: "daylight", in: ["day"], points: -2, note: "白天这点光毫无意义" },
        ],
      },
      {
        label: "不换，攒着力气敲下去",
        detail: "不用电。敲到你没力气为止。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你敲不了几下了" },
        ],
      },
      { label: "两样都不做，安静等着", detail: "不耗电。也许安静地活着被找到就够了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l25",
    stage: "late",
    tags: ["screen", "social"],
    prompt: [
      "你收到最后一条：保持体力，我们到了会喊你。",
      "他们让你别再耗电了。听，还是不听。",
    ],
    options: [
      {
        label: "听话，关机等待",
        detail: "不耗电。把余量完整留到那一刻。",
        cost: 0,
        tags: ["wait"],
      },
      {
        label: "不听，再发一条补充信息",
        detail: "也许他们不知道那一边还有人。这一条可能很关键。",
        cost: 120,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这条补充送不出去" },
        ],
      },
      {
        label: "折中：留一半电，现在只发最短的",
        detail: "两边都不得罪。也两边都不到位。",
        cost: 55,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
    ],
  },
  {
    id: "l26",
    stage: "late",
    tags: ["move", "risk"],
    prompt: [
      "有一个出口看起来就在眼前。但中间那段路是很久以前塌的。",
      "最后一段路。走，还是等。",
    ],
    options: [
      {
        label: "开手电走完这段",
        detail: "照着走最稳。但你只剩这点电了。",
        cost: 165,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里，不烧手机" },
          { key: "injury", in: ["fracture"], points: -1, note: "这个伤走不了这段" },
        ],
      },
      {
        label: "摸着走",
        detail: "不用电。塌过的路，摸着走风险不小。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.45, hint: "这段路撑不撑得住你，看命" },
      },
      { label: "不走，原地等", detail: "不耗电。也许这里更安全。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l27",
    stage: "late",
    tags: ["screen", "medical"],
    prompt: [
      "你想让外面知道这里的医疗优先级。而这只剩一次发送。",
      "最后一次发送，说什么最划算。",
    ],
    options: [
      {
        label: "报伤情分级，让医疗先上",
        detail: "这一条可能直接改变救援顺序。",
        cost: 130,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["bleeding", "fracture"], points: 1, note: "确有重伤，这一条最要紧" },
          { key: "injury", in: ["none"], points: -1, note: "没人大碍，报这个多余" },
        ],
      },
      {
        label: "报位置和人数，其余不提",
        detail: "最通用的信息。安全，但不够锋利。",
        cost: 110,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
      },
      { label: "不发了，留着给最后那一下", detail: "不耗电。也许最后那一下更值得。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l28",
    stage: "late",
    tags: ["social", "light"],
    prompt: [
      "你身边那个人把唯一的毯子给了你。而他一直在抖。",
      "最后一点余量，也可以换成别人的温度。",
    ],
    options: [
      {
        label: "把手机塞进他手里让他捂着",
        detail: "不用电。手机那点余温也算温度。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "relay", points: 1 },
        env: [
          { key: "temp", in: ["freezing"], points: 1, note: "严寒里这一手最实在" },
        ],
      },
      {
        label: "开手电照着他，让他知道有人在",
        detail: "陪伴也是一种处置。电在花。",
        cost: 75,
        tags: ["light", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: 1, note: "夜里这一点光能稳住人" },
        ],
      },
      { label: "顾好自己，别的顾不上", detail: "不耗电。你已经到极限了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l29",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "有个功能你一直没敢开：它会把剩下的电一次性用掉。",
      "一个按钮，按下就是全部。你按不按。",
    ],
    options: [
      {
        label: "按下，把全部换成一次强信号",
        detail: "最大功率的一下。能不能成，看这一下。",
        cost: 260,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 3, odds: 0.55, hint: "强信号能不能穿透这层废墟，只能赌" },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，功率再大也没用" },
          { key: "network", in: ["local"], points: 1, note: "局部有网，这下大概率能成" },
        ],
      },
      {
        label: "不按，分成几次小的",
        detail: "稳妥。总量不变，成功率也许更高。",
        cost: 150,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
      },
      { label: "不按，留着", detail: "不耗电。也许活着被挖出来更值。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l30",
    stage: "late",
    tags: ["nav", "voice"],
    prompt: [
      "外面喊：能不能看到光。而你这边什么都看不见。",
      "他们需要你确认。而这个确认，也许不用花电。",
    ],
    options: [
      {
        label: "喊回去说看不见",
        detail: "不用电。诚实也是一种信息。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你喊不出大声" },
        ],
      },
      {
        label: "开手电照向自己的位置，让他们确认",
        detail: "用光回答。电在花，但信息更确凿。",
        cost: 95,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["night"], points: 1, note: "夜里这道光能让他们看准" },
          { key: "daylight", in: ["day"], points: -2, note: "白天照了也看不见" },
        ],
      },
      { label: "不回答，省着力气", detail: "不耗电。也许他们会自己找过来。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l31",
    stage: "late",
    tags: ["social", "screen"],
    prompt: [
      "你意识到一件事：你一直在替所有人拿主意。",
      "最后一个决定：要不要把决定权交出去。",
    ],
    options: [
      {
        label: "交出去，让大家投票",
        detail: "不用电。多数人的选择未必比你差。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "亮屏把选项摆出来再投",
        detail: "信息透明。亮屏要电。",
        cost: 65,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "继续自己拿主意", detail: "不耗电。你已经拿了一路了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l32",
    stage: "late",
    tags: ["screen", "nav"],
    prompt: [
      "你最后一次确认：他们到底知不知道你在这一层。",
      "一个核对，也许能省下几小时的错挖。",
    ],
    options: [
      {
        label: "发一条核对信息，附坐标",
        detail: "最后一次亮屏。核对完了你就可以放心等了。",
        cost: 125,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这条核对送不出去" },
        ],
      },
      {
        label: "只敲管子确认彼此方位",
        detail: "不用电。粗糙，但足够对齐。",
        cost: 0,
        tags: ["voice", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不核对了，相信他们", detail: "不耗电。怀疑也要花力气。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l33",
    stage: "late",
    tags: ["light", "paper"],
    prompt: [
      "你想给挖到这里的人留一句话。这句话不该依赖电。",
      "最后一个信号，要能撑过手机没电之后的那些小时。",
    ],
    options: [
      {
        label: "用石头在墙上刻字",
        detail: "不用电。慢，但永远在。",
        cost: 0,
        tags: ["paper"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "carry", in: ["none"], points: 1, note: "没笔也能刻，石头到处都是" },
        ],
      },
      {
        label: "把手机屏幕定格在一行字上",
        detail: "醒目。但屏幕一没电就什么都没了。",
        cost: 155,
        tags: ["screen", "light"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "daylight", in: ["day"], points: -1, note: "白天屏幕反光，字看不清" },
        ],
      },
      {
        label: "把衣服撕成布条系在显眼处",
        detail: "不用电。也许比字更容易被注意到。",
        cost: 0,
        tags: ["light"],
        gain: { outcome: "light", points: 1 },
      },
    ],
  },
  {
    id: "l34",
    stage: "late",
    tags: ["medical", "screen"],
    prompt: [
      "你不确定自己还能撑多久。而这个判断会影响救援的顺序。",
      "要不要把自己也报进去。",
    ],
    options: [
      {
        label: "如实报上自己的状态",
        detail: "诚实会让资源分配更准。这一下要花电。",
        cost: 100,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["bleeding", "fracture"], points: 1, note: "你确实该被算进去" },
        ],
      },
      {
        label: "不报自己，只报别人",
        detail: "不用电。也许你还能撑一会儿。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "让别人替你报", detail: "不耗电。别人看得见你的样子。", cost: 0, tags: ["social"] },
    ],
  },
  {
    id: "l35",
    stage: "late",
    tags: ["risk", "voice"],
    prompt: [
      "最后一点力气。喊一次大的，还是留着。",
      "你的嗓子还剩一次。这一次用不用。",
    ],
    options: [
      {
        label: "喊一次最大的",
        detail: "不用电。喊完可能就再也喊不出来了。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: { outcome: "light", points: 2, odds: 0.5, hint: "这一次他们听不听得见，不好说" },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你现在喊不出大声" },
          { key: "disaster", in: ["typhoon"], points: -1, note: "风声会把它全吃掉" },
        ],
      },
      {
        label: "留着，等听见动静再喊",
        detail: "不用电。等一个最值的时候。",
        cost: 0,
        tags: ["wait"],
        env: [
          { key: "daylight", in: ["night"], points: 1, note: "夜里安静，留到那时候喊最值" },
        ],
      },
      { label: "改用敲，把嗓子留着", detail: "不耗电。敲击比喊更耐久。", cost: 0, tags: ["voice"] },
    ],
  },
  {
    id: "l36",
    stage: "late",
    tags: ["screen", "social"],
    prompt: [
      "你手里这条消息，可以署你的名字，也可以不署。",
      "最后一条：要不要让人知道这是你发的。",
    ],
    options: [
      {
        label: "署上名字发出去",
        detail: "多一点字，多一点电。但从此有人知道你在这儿。",
        cost: 115,
        tags: ["screen", "social"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，署名也没人收得到" },
        ],
      },
      {
        label: "不署名，只发内容",
        detail: "省一点。内容到了就够了。",
        cost: 85,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
      { label: "不发了，让活着这件事说话", detail: "不耗电。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l37",
    stage: "late",
    tags: ["nav", "move"],
    prompt: [
      "你所在的位置比你以为的更靠近出口。也许是时候动了。",
      "最后一段距离。而这台手机只剩最后一点。",
    ],
    options: [
      {
        label: "留着电，靠自己挪出去",
        detail: "不用电。挪不挪得动，看你的身体。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "这段路你的身体撑不撑得住" },
        env: [
          { key: "injury", in: ["fracture", "bleeding"], points: -1, note: "这个伤挪不动" },
        ],
      },
      {
        label: "用电换一段照明，稳稳走完",
        detail: "照着走更稳，也更快。代价是最后这点电。",
        cost: 140,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里，不烧手机" },
        ],
      },
      { label: "不动了，等他们挖进来", detail: "不耗电。也许动比不动更危险。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l38",
    stage: "late",
    tags: ["screen", "light"],
    prompt: [
      "天快亮了。而天一亮，你这点光就不值钱了。",
      "一个时间窗口正在关上。你要不要赶在它关上前用掉。",
    ],
    options: [
      {
        label: "赶在天亮前把光用掉",
        detail: "现在用，还值钱。再等等就一文不值。",
        cost: 130,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["night", "dusk"], points: 1, note: "趁黑用掉，这一手对" },
          { key: "daylight", in: ["day"], points: -2, note: "天已经亮了，来不及了" },
        ],
      },
      {
        label: "留着，天亮后改用别的办法",
        detail: "不用电。天亮了办法自然多。",
        cost: 0,
        tags: ["wait"],
        env: [
          { key: "daylight", in: ["day"], points: 1, note: "已经天亮，这个判断正对" },
        ],
      },
      { label: "不管天亮不亮，该用就用", detail: "不耗电在等待上，该花的还是花。", cost: 90, tags: ["light"] },
    ],
  },
  {
    id: "l39",
    stage: "late",
    tags: ["social", "voice"],
    prompt: [
      "有人问你：我们会不会死在这儿。所有人都在等你的答案。",
      "最后一个问题，不是关于电的。但每个人都看着你。",
    ],
    options: [
      {
        label: "说实话：不知道，但我们已经发出去了",
        detail: "不用电。实话有时候最稳。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "亮屏把已发送的记录给他们看",
        detail: "证据比话有力。亮屏要电。",
        cost: 60,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "其实一条都没发出去，没什么可看的" },
        ],
      },
      { label: "不回答，继续做手上的事", detail: "不耗电。也许沉默就是答案。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "l40",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "最后一次亮屏的机会。你要用它做什么，现在就得定。",
      "这一下之后，这台手机就不再属于你了。",
    ],
    options: [
      {
        label: "发出位置，让他们在对的地方挖",
        detail: "位置是最硬的信息。挖错了什么都没用。",
        cost: 150,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，位置靠卫星定位发出去，很悬" },
          { key: "network", in: ["local"], points: 1, note: "有网，这一下稳" },
        ],
      },
      {
        label: "发一句话给最重要的人",
        detail: "不图救援。只图一句。",
        cost: 120,
        tags: ["screen", "social"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这句话送不到" },
        ],
      },
      {
        label: "什么都不发，让它亮到最后一刻",
        detail: "不当光源，也不发消息。就让它亮着。",
        cost: 80,
        tags: ["light"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: 1, note: "夜里这点光也许就是被发现的理由" },
        ],
      },
      {
        label: "不亮了，把最后一格留到被挖出来那一刻",
        detail: "不用电。也许活着被挖出来，本身就是最有力的信号。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
];
