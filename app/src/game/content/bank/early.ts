import type { Question } from "../../types";

/**
 * 早期题库：先把处境弄清楚。
 * 写作规矩见 content/questions.ts 顶部。成本单位是 0.001%，满值 1000。
 */
export const EARLY_EXTRA: Question[] = [
  {
    id: "e09",
    stage: "early",
    tags: ["nav"],
    prompt: [
      "你被压在一个斜面上。往上还是往下，决定了你往哪头爬。",
      "脚下的地面是斜的。这个坡度告诉你一些事，如果你读得懂的话。",
    ],
    options: [
      {
        label: "开水平仪测坡度",
        detail: "手机里有个小工具能量出倾斜角，代价是亮一次屏。",
        cost: 55,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["mudslide", "avalanche"], points: -1, note: "整片坡都在动，测出来的数立刻就过期" },
        ],
      },
      {
        label: "顺着水流的方向推",
        detail: "不用电。水往低处走，低处通常通向外面。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
        env: [
          { key: "disaster", in: ["flood"], points: 1, note: "积水给了你一条明确的线索" },
          { key: "disaster", in: ["fire"], points: -1, note: "这里没有水可看" },
        ],
      },
      { label: "先不动，等身体缓过来", detail: "不耗电。也许缓一会儿判断更准。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e10",
    stage: "early",
    tags: ["medical", "screen"],
    prompt: [
      "你的手指发麻，而且是持续性的。这不是好兆头。",
      "有东西压着你的胳膊，时间一长就不是压着那么简单了。",
    ],
    options: [
      {
        label: "计时器设定一个提醒",
        detail: "每隔一段时间提醒你活动一次。亮屏写一次，之后不用再管。",
        cost: 45,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["fracture", "bleeding"], points: 1, note: "这种伤最怕的就是被忘记" },
        ],
      },
      {
        label: "自己默默数数",
        detail: "不用电。数着数着可能会走神。",
        cost: 0,
        tags: ["medical"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "不管它，先办别的", detail: "麻一会儿也许就过去了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e11",
    stage: "early",
    tags: ["screen", "risk"],
    prompt: [
      "手机背面有点鼓。你知道这意味着什么。",
      "电池在发烫。继续用，还是现在就收手？",
    ],
    options: [
      {
        label: "查一下电池健康与温度",
        detail: "亮屏看一眼。知道底细才好规划后面每一步。",
        cost: 40,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
        env: [
          { key: "temp", in: ["sultry"], points: 1, note: "闷热里这一步尤其要紧" },
        ],
      },
      {
        label: "把手机挪远一点继续用",
        detail: "不耗电。离身体远些，散热好些。",
        cost: 0,
        tags: ["wait"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "当作没看见", detail: "知道也没用，反正还得用。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e12",
    stage: "early",
    tags: ["nav", "voice"],
    prompt: [
      "外面有风灌进来。风里带着一种味道。",
      "空气在流动。这说明某处是通的——但通到哪去，还不知道。",
    ],
    options: [
      {
        label: "开手电顺着风找源头",
        detail: "照着找最快，手电一亮就是一笔。",
        cost: 95,
        tags: ["light", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "自带手电，不烧手机的电" },
          { key: "disaster", in: ["fire"], points: -1, note: "烟把什么都糊住了" },
        ],
      },
      {
        label: "撕一条布条测风向",
        detail: "不用电。粗糙，但够用。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
      },
      {
        label: "朝风来的方向喊",
        detail: "不耗电。有人在外面的话，风会把声音带过去。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.45, hint: "风声也会盖住你自己的声音" },
        env: [
          { key: "disaster", in: ["typhoon"], points: -2, note: "台风里喊破喉咙也没人听得见" },
        ],
      },
    ],
  },
  {
    id: "e13",
    stage: "early",
    tags: ["social", "screen"],
    prompt: [
      "你听见两个人在争论往哪边走。他们等着你表态。",
      "人群开始分成两派。而你是唯一一个有手机的人。",
    ],
    options: [
      {
        label: "亮屏给他们看地图再定",
        detail: "用事实说话最服人，代价是这一下亮屏。",
        cost: 120,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，地图只能看个大概" },
        ],
      },
      {
        label: "口头拍板，选一边",
        detail: "不用电。拍错了责任在你。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "让他们自己吵出结果", detail: "不耗电。也许他们比你更清楚。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e14",
    stage: "early",
    tags: ["screen", "nav"],
    prompt: [
      "你想知道现在几点。时间在这里比你想的重要。",
      "外面是白天还是黑夜？这决定了你该发光还是该发声。",
    ],
    options: [
      {
        label: "亮屏看时间",
        detail: "最省的一档亮屏。但也是电。",
        cost: 25,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
        env: [
          { key: "daylight", in: ["day"], points: -1, note: "外头亮得晃眼，根本不用看表" },
        ],
      },
      {
        label: "从缝隙里看天色",
        detail: "不用电。看得见就有答案，看不见就没答案。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: -1, note: "外面黑得什么都看不出来" },
        ],
      },
      { label: "时间不重要，跳过", detail: "知道几点也换不来电。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e15",
    stage: "early",
    tags: ["move", "risk"],
    prompt: [
      "头顶传来第二次响动。第一次你当错觉，这次不是。",
      "结构在响。它告诉你：这里待不久了。",
    ],
    options: [
      {
        label: "开手电快速评估出口",
        detail: "照一遍就跑，是最稳的做法，也最贵。",
        cost: 130,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "injury", in: ["fracture"], points: -2, note: "腿这个样子，快不了" },
          { key: "carry", in: ["torch"], points: 1, note: "手电在你自己手里" },
        ],
      },
      {
        label: "摸黑往外挪",
        detail: "不耗电。慢，而且可能挪错方向。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "黑里挪动，撞上什么是运气问题" },
      },
      {
        label: "弓身护住头颈，原地等",
        detail: "不耗电。等这一波过去，也许更安全。",
        cost: 0,
        tags: ["wait"],
        env: [
          { key: "disaster", in: ["avalanche", "mudslide"], points: -1, note: "这种灾里等着等于把自己埋上" },
        ],
      },
    ],
  },
  {
    id: "e16",
    stage: "early",
    tags: ["medical", "paper"],
    prompt: [
      "身边那位伤得不清。你该把他记下来，留给后面的人看。",
      "有一个人已经说不出话了。他的情况得有人替他传达。",
    ],
    options: [
      {
        label: "拍照记录他的状态",
        detail: "一张照片胜过一百句描述。但镜头和屏幕都吃电。",
        cost: 140,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: -1, note: "黑成这样，拍出来什么都看不清" },
          { key: "carry", in: ["torch"], points: 1, note: "有手电补光，拍得清" },
        ],
      },
      {
        label: "记在纸上别在衣服上",
        detail: "不耗电。会一直跟着他到被抬出去。",
        cost: 0,
        tags: ["paper", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "carry", in: ["pen"], points: 1, note: "有笔，写得清楚" },
          { key: "carry", in: ["none"], points: -1, note: "没笔，只能口述" },
        ],
      },
      { label: "先记在脑子里", detail: "不耗电。但你自己也可能撑不到那时候。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e17",
    stage: "early",
    tags: ["screen", "risk"],
    prompt: [
      "SIM 卡似乎还能注册上网络。你想试一下。",
      "手机提示「正在搜索网络」。这个过程本身就在耗电。",
    ],
    options: [
      {
        label: "强制搜网一次",
        detail: "搜到了什么都好办，搜不到就是白花一笔。",
        cost: 110,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 2, odds: 0.5, hint: "基站还在不在，谁也不知道" },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "周边基站全塌了，搜也是白搜" },
          { key: "network", in: ["local"], points: 2, note: "局部有网，这一搜就能挂上" },
        ],
      },
      {
        label: "等它自己注册",
        detail: "不耗电。也许过一会儿它自己就上去了。",
        cost: 0,
        tags: ["wait"],
      },
      { label: "关掉搜网，彻底断了这个念头", detail: "不耗电。省下来的电留给别的。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e18",
    stage: "early",
    tags: ["nav", "screen"],
    prompt: [
      "你记得这栋楼的结构。但记得的和现在的，未必是同一栋。",
      "脑子里有一张平面图，可它和眼前的废墟对不上。",
    ],
    options: [
      {
        label: "调出楼层示意图核对",
        detail: "存过的图不用网。亮屏看一眼，心里就有数了。",
        cost: 85,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["earthquake", "mudslide"], points: -1, note: "结构全变了，图纸对不上" },
          { key: "network", in: ["dead"], points: 1, note: "离线图正好用得上" },
        ],
      },
      {
        label: "凭手摸墙找承重结构",
        detail: "不用电。慢，但摸到的是真的。",
        cost: 0,
        tags: ["move", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不核对了，凭直觉走", detail: "直觉有时候比图纸管用。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e19",
    stage: "early",
    tags: ["social", "voice"],
    prompt: [
      "有个孩子一直在哭。哭声会招来注意，也会耗掉所有人的力气。",
      "哭声传得比你喊得远。问题是你该怎么用它。",
    ],
    options: [
      {
        label: "哄住他，教他有节奏地喊",
        detail: "不耗电。把哭声变成信号，是这一手的价值。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你自己都没力气哄人" },
        ],
      },
      {
        label: "让孩子自己哭，你省力气",
        detail: "不耗电。哭声本身就是信号。",
        cost: 0,
        tags: ["wait"],
        gain: { outcome: "light", points: 1 },
      },
      { label: "带他一起挪到人多的地方", detail: "不耗电。但挪动要花力气。", cost: 0, tags: ["move", "social"] },
    ],
  },
  {
    id: "e20",
    stage: "early",
    tags: ["screen", "light"],
    prompt: [
      "你的屏幕裂了，但还能亮。这既是麻烦，也是筹码。",
      "裂屏漏出来的光，比你想的多。",
    ],
    options: [
      {
        label: "把亮度拉满当光源",
        detail: "裂屏漏光反而不费电。但这是拿可靠性换光。",
        cost: 70,
        tags: ["screen", "light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天这点光没有意义" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里这点光很有用" },
        ],
      },
      {
        label: "贴着缝隙往外照",
        detail: "少花一点电。效果不如全亮，但省。",
        cost: 35,
        tags: ["light"],
        gain: { outcome: "light", points: 1 },
      },
      { label: "屏幕留着发消息用", detail: "不当灯使。光可以用别的办法。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e21",
    stage: "early",
    tags: ["nav", "move"],
    prompt: [
      "有条缝能容一个人爬过去。缝那头是什么，你看不见。",
      "面前只有一个口子。钻，还是不钻。",
    ],
    options: [
      {
        label: "开手电先探一遍",
        detail: "照清楚了再钻。手电开着就在烧电。",
        cost: 80,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里，不烧手机" },
        ],
      },
      {
        label: "伸手进去摸",
        detail: "不用电。摸到什么算什么。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "那头是什么，全凭手感" },
      },
      { label: "不钻，等外面来人", detail: "不耗电。也许这里本来就更容易被找到。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e22",
    stage: "early",
    tags: ["medical", "screen"],
    prompt: [
      "你在流血，而且止不住。时间在这里是另一种电量。",
      "伤口一直在渗。你知道它的优先级可能高于一切。",
    ],
    options: [
      {
        label: "用手机光找到止血点压住",
        detail: "照清楚了才好压。这一点电花得值不值，你自己判断。",
        cost: 65,
        tags: ["light", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: 1, note: "正是这种情况最需要看清楚" },
          { key: "daylight", in: ["day"], points: -1, note: "白天有光，开手电多余" },
        ],
      },
      {
        label: "让旁边的人帮你压",
        detail: "不用电。别人未必压得对，但你省下了。",
        cost: 0,
        tags: ["social", "medical"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "先不管，抓紧办事", detail: "时间不站在你这边。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e23",
    stage: "early",
    tags: ["screen", "nav"],
    prompt: [
      "你听见水流声。它可能是出路，也可能是麻烦。",
      "水在下面响。跟着水走通常没错——通常。",
    ],
    options: [
      {
        label: "查地形高程判断走向",
        detail: "存过的地形数据不用网。亮屏看一眼。",
        cost: 75,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["flood"], points: 1, note: "洪水里高程最说明问题" },
          { key: "network", in: ["dead"], points: 1, note: "离线数据照样能看" },
        ],
      },
      {
        label: "朝水声走",
        detail: "不用电。但水可能正往你这儿来。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.55, hint: "水通向出口，还是通向更深的坑" },
        env: [
          { key: "disaster", in: ["flood"], points: -1, note: "涨水的时候跟着水走是危险的" },
        ],
      },
      { label: "远离水，往高处走", detail: "不耗电。稳妥，但可能错过出口。", cost: 0, tags: ["move"] },
    ],
  },
  {
    id: "e24",
    stage: "early",
    tags: ["social", "nav"],
    prompt: [
      "有人自称是这里的员工，说知道安全通道在哪。",
      "一个陌生人主动要当向导。你信不信？",
    ],
    options: [
      {
        label: "让他描述，你对照地图核实",
        detail: "亮屏核对。信人不如信图，图也要电。",
        cost: 90,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，图只能看个轮廓" },
        ],
      },
      {
        label: "跟着他走",
        detail: "不用电。信对了省大事，信错了全完。",
        cost: 0,
        tags: ["social", "move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "他到底记不记得，只能试" },
      },
      { label: "不跟，自己想办法", detail: "不耗电。也许你本来就不该信他。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e25",
    stage: "early",
    tags: ["screen", "risk"],
    prompt: [
      "你的手机提示有紧急广播。这条消息可能是给整片区域的。",
      "系统弹了一条东西。看，还是不看。",
    ],
    options: [
      {
        label: "展开读完",
        detail: "内容多，屏幕亮得久。但广播里通常有关键信息。",
        cost: 105,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "断网的情况下广播根本推不进来" },
          { key: "network", in: ["local", "flicker"], points: 1, note: "有网，广播推得进来" },
        ],
      },
      {
        label: "只看标题",
        detail: "亮一下就关。便宜，但可能漏掉要紧的。",
        cost: 30,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
      { label: "不看，直接关掉", detail: "不耗电。广播里的未必对你有用。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e26",
    stage: "early",
    tags: ["move", "medical"],
    prompt: [
      "你试着站起来，发现重心不对。身体在告诉你一件事。",
      "想动，就得先知道哪一处能动。",
    ],
    options: [
      {
        label: "开手电检查自己全身",
        detail: "看清楚了再动，避免二次伤害。",
        cost: 70,
        tags: ["light", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["fracture", "bleeding"], points: 1, note: "这种伤最需要先看清楚" },
          { key: "daylight", in: ["day"], points: -1, note: "大白天开手电查自己，浪费" },
        ],
      },
      {
        label: "慢慢试，哪里疼就停",
        detail: "不用电。慢一点，但一分不花。",
        cost: 0,
        tags: ["medical"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "不管疼不疼，先动起来", detail: "时间更重要。", cost: 0, tags: ["move"] },
    ],
  },
  {
    id: "e27",
    stage: "early",
    tags: ["nav", "screen"],
    prompt: [
      "远处有持续的机械声。它在移动，你想知道往哪移。",
      "机器响了一遍又一遍。这个节奏里藏着方位。",
    ],
    options: [
      {
        label: "录一段声音分析",
        detail: "录音和分析都要电。但能从噪声里抠出方向。",
        cost: 115,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["typhoon"], points: -1, note: "风声把一切都盖住了" },
        ],
      },
      {
        label: "用两只耳朵反复比",
        detail: "不用电。粗糙，但方位大致错不了。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不听了，机器声不代表救我", detail: "不耗电。也许他们在挖别处。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e28",
    stage: "early",
    tags: ["social", "paper"],
    prompt: [
      "你说了一句很重要的话。可没人记得住。",
      "安排说出口就散了。你需要它留下来。",
    ],
    options: [
      {
        label: "发到群里，让大家都收到",
        detail: "一次到位。电是你出的，但人人手里都有一份。",
        cost: 100,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，发出去也没人收得到" },
        ],
      },
      {
        label: "写在纸上贴起来",
        detail: "不耗电。会一直在那儿，手机没电了也在。",
        cost: 0,
        tags: ["paper", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "carry", in: ["pen"], points: 1, note: "有笔，写得清楚明白" },
          { key: "carry", in: ["none"], points: -1, note: "没笔，只能口头反复说" },
        ],
      },
      { label: "口头说三遍就算了", detail: "不耗电。记住多少算多少。", cost: 0, tags: ["voice"] },
    ],
  },
  {
    id: "e29",
    stage: "early",
    tags: ["screen", "light"],
    prompt: [
      "你想让手机在关键时候还能亮一次。这需要现在就做准备。",
      "留一手：让最后一点电在最该用的时候用掉。",
    ],
    options: [
      {
        label: "设定低电量自动执行",
        detail: "一次设置，之后全自动。要亮屏写进去。",
        cost: 50,
        tags: ["screen"],
        gain: { outcome: "light", points: 1 },
      },
      {
        label: "把屏幕调到自动亮度",
        detail: "便宜。省多少看环境。",
        cost: 20,
        tags: ["screen"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: -1, note: "夜里自动亮度也救不了多少" },
        ],
      },
      { label: "不设了，手动来", detail: "不耗电。自己控制更放心。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e30",
    stage: "early",
    tags: ["risk", "nav"],
    prompt: [
      "有一处结构看起来能拆。拆开也许是路，也许是塌方。",
      "一块板挡在你和外面之间。撬，还是不撬。",
    ],
    options: [
      {
        label: "开手电看清受力再撬",
        detail: "照清楚了再动手。手电开着在烧电。",
        cost: 90,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里" },
          { key: "disaster", in: ["earthquake"], points: -1, note: "余震随时来，看得再清也不保险" },
        ],
      },
      {
        label: "闭着眼撬",
        detail: "不用电。撬对了赚，撬错了塌。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.45, hint: "这一撬下去是路还是塌，看命" },
      },
      { label: "不撬，等外面挖", detail: "不耗电。乱动可能把自己埋了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e31",
    stage: "early",
    tags: ["medical", "social"],
    prompt: [
      "你的呼吸开始发紧。灰尘在空气里。",
      "每吸一口气都要费点劲。这会影响你后面所有的事。",
    ],
    options: [
      {
        label: "用手机光找一块湿布捂住口鼻",
        detail: "照着找得快。这一点电买的是后面所有判断的清醒。",
        cost: 60,
        tags: ["light", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "disaster", in: ["fire"], points: 1, note: "烟里这一手最要紧" },
          { key: "daylight", in: ["day"], points: -1, note: "天光够，不用开灯找" },
        ],
      },
      {
        label: "撕衣服凑合捂上",
        detail: "不用电。粗糙但管用。",
        cost: 0,
        tags: ["medical"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "忍一忍就过去了", detail: "不耗电。也许灰尘会自己落下去。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e32",
    stage: "early",
    tags: ["screen", "social"],
    prompt: [
      "你想确认一件事：家里人是不是知道你在这儿。",
      "有个念头压着你——他们可能还以为你在别的地方。",
    ],
    options: [
      {
        label: "给家里发一条报平安",
        detail: "内容不长。发出去他们就知道你在哪。",
        cost: 95,
        tags: ["screen", "social"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这条发不出去" },
          { key: "network", in: ["weak"], points: -1, note: "信号太弱，可能发到一半断掉" },
        ],
      },
      {
        label: "托身边的人出去后转告",
        detail: "不用电。前提是有人能出去。",
        cost: 0,
        tags: ["social", "risk"],
        gamble: { outcome: "ack", points: 2, odds: 0.5, hint: "他能不能出去，还是个未知数" },
      },
      { label: "先不发，救援会通知他们", detail: "不耗电。也许这本来就不归你管。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e33",
    stage: "early",
    tags: ["nav", "move"],
    prompt: [
      "你脚下是空的。再往前一步，可能是下一层。",
      "地面有个窟窿。掉下去也许更糟，也许更接近出口。",
    ],
    options: [
      {
        label: "开手电往下面照",
        detail: "看清楚再决定。手电开着就在烧电。",
        cost: 75,
        tags: ["light", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里" },
        ],
      },
      {
        label: "扔块石头听回声",
        detail: "不用电。回声能告诉你深浅。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "离那窟窿远点", detail: "不耗电。稳妥些。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e34",
    stage: "early",
    tags: ["screen", "risk"],
    prompt: [
      "你的手指在抖。而接下来的每一步都需要稳。",
      "抖成这样，很多精细操作都会打折扣。",
    ],
    options: [
      {
        label: "开语音输入代替打字",
        detail: "语音识别要联网也耗电，但省下你打字的时间。",
        cost: 85,
        tags: ["screen", "voice"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "network", in: ["dead", "weak"], points: -1, note: "没网就没法识别" },
          { key: "temp", in: ["freezing"], points: -1, note: "冻得舌头都硬了，说不清楚" },
        ],
      },
      {
        label: "慢慢打，抖就抖",
        detail: "不用额外电。慢一点，但省。",
        cost: 0,
        tags: ["wait"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "让手稳的人替你操作",
        detail: "不用电。但你怎么说，他就怎么打。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "brief", points: 1 },
      },
    ],
  },
  {
    id: "e35",
    stage: "early",
    tags: ["light", "nav"],
    prompt: [
      "外面亮着一种不自然的光。你想知道那是什么。",
      "有光从缝隙里渗进来。光源决定了你该往哪看。",
    ],
    options: [
      {
        label: "用摄像头放大看",
        detail: "镜头加屏幕，双份耗电，但看得最远。",
        cost: 125,
        tags: ["screen", "light"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "daylight", in: ["night", "dusk"], points: 1, note: "天暗下来的时候镜头最好使" },
          { key: "disaster", in: ["fire"], points: -1, note: "到处是火光，分不清哪个是哪个" },
        ],
      },
      {
        label: "贴着缝用眼睛看",
        detail: "不用电。看得有限。",
        cost: 0,
        tags: ["light"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不看了，光不一定代表人", detail: "不耗电。也许是燃烧，也许是别的。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e36",
    stage: "early",
    tags: ["move", "social"],
    prompt: [
      "你旁边的人想分开行动。合在一起，还是各走各的？",
      "有人主张分散寻找出口，理由是覆盖面更大。",
    ],
    options: [
      {
        label: "约定一个汇合点并用地图记下",
        detail: "亮屏存一个点。散得再开也找得回来。",
        cost: 80,
        tags: ["screen", "nav", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: 1, note: "离线存点，有没有网都一样" },
        ],
      },
      {
        label: "口头约个汇合点",
        detail: "不用电。记错了就散了。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "不许分开，聚在一起", detail: "不耗电。人少反而好找。", cost: 0, tags: ["social"] },
    ],
  },
  {
    id: "e37",
    stage: "early",
    tags: ["screen", "nav"],
    prompt: [
      "你想给自己在这个空间里定一个坐标。哪怕粗糙的。",
      "没有坐标，你后面所有的描述都是空话。",
    ],
    options: [
      {
        label: "一次定位并截图保存",
        detail: "定位加截图，一气呵成，代价不小。",
        cost: 155,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "断网只能靠卫星，慢而且飘" },
          { key: "network", in: ["local", "flicker"], points: 1, note: "有网，定位快而准" },
        ],
      },
      {
        label: "数步数和层数，自己记",
        detail: "不用电。粗糙但属于你。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "坐标不重要，先出去再说", detail: "不耗电。也许走着走着就知道了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e38",
    stage: "early",
    tags: ["social", "voice"],
    prompt: [
      "有人在喊你的名字。声音很远，但确实在喊你。",
      "外面有人叫你。回应一下，代价是什么？",
    ],
    options: [
      {
        label: "开手电朝那边晃",
        detail: "用光回应最快。代价是电。",
        cost: 90,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天没人看得见你的手电" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里这一晃能传很远" },
        ],
      },
      {
        label: "扯着嗓子回一声",
        detail: "不用电。嗓子是你的，用完了就没了。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你现在喊不出大声" },
        ],
      },
      { label: "不回应，留着力气", detail: "不耗电。也许喊你的人本来就在往这边来。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e39",
    stage: "early",
    tags: ["screen", "medical"],
    prompt: [
      "你身上有一处伤，你判断不了轻重。手机里有个能帮你的东西。",
      "有症状你拿不准。查，还是不查。",
    ],
    options: [
      {
        label: "查一下急救指引",
        detail: "离线存的急救手册不用网。亮屏读一段。",
        cost: 65,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: 1, note: "离线手册正好用得上" },
          { key: "injury", in: ["none"], points: -1, note: "你身上没什么要紧的伤，查这个多余" },
        ],
      },
      {
        label: "凭经验处理",
        detail: "不用电。经验未必对。",
        cost: 0,
        tags: ["medical"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "不管，先顾别的", detail: "不耗电。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "e40",
    stage: "early",
    tags: ["risk", "screen"],
    prompt: [
      "你想给手机留一条后路：一个不用电也能被找到的办法。",
      "在彻底断电之前，能不能先布一个不需要电的信号？",
    ],
    options: [
      {
        label: "定时让屏幕每隔一阵闪一次",
        detail: "设一次，之后自动闪。代价是一次亮屏设置。",
        cost: 70,
        tags: ["screen", "light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天的闪烁毫无意义" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里规律闪烁最容易被认出来" },
        ],
      },
      {
        label: "把手机壳拆了当反光片挂出去",
        detail: "不用电。有没有光可反，看运气。",
        cost: 0,
        tags: ["light", "risk"],
        gamble: { outcome: "light", points: 2, odds: 0.5, hint: "得有光正好照到它才行" },
      },
      { label: "什么都不布，留着电", detail: "不耗电。也许最后一下更要紧。", cost: 0, tags: ["wait"] },
    ],
  },
];
