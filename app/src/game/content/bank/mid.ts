import type { Question } from "../../types";

/**
 * 中期题库：把消息送出去。
 * 这一阶段抽得最多（4 道），所以这里的变化最能拉开不同局之间的差距。
 */
export const MID_EXTRA: Question[] = [
  {
    id: "m11",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "信号忽然满了一格。窗口可能只有几秒。",
      "这么好的信号，之前没有，之后未必还有。",
    ],
    options: [
      {
        label: "立刻把最要紧的一条推出去",
        detail: "抢窗口。内容尽量压缩，但发送本身要电。",
        cost: 130,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 2, odds: 0.6, hint: "窗口能不能撑到发完，看运气" },
        env: [
          { key: "network", in: ["flicker"], points: -1, note: "断续的网最容易把消息断在半路" },
          { key: "network", in: ["local"], points: 1, note: "局部网稳一些，这一下多半能成" },
        ],
      },
      {
        label: "先发最短的一句占位",
        detail: "便宜。先让对方知道你在，细节后补。",
        cost: 45,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
      { label: "等下个更好的窗口", detail: "不耗电。下一个窗口未必更好。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m12",
    stage: "mid",
    tags: ["light", "voice"],
    prompt: [
      "救援在敲管子回应你。他们问：几个人。",
      "外面用敲击在问话。你得用敲击答回去。",
    ],
    options: [
      {
        label: "亮屏把人数显示给旁边的人看，让他们敲",
        detail: "你提供准确的数，别人出力气。要花一次亮屏。",
        cost: 60,
        tags: ["screen", "social"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "直接敲回去，几下代表几个人",
        detail: "不用电。前提是外面那套暗号和你一样。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: { outcome: "people", points: 1, odds: 0.55, hint: "他们懂不懂这套敲法，不好说" },
      },
      { label: "先不答，攒着力气", detail: "不耗电。也许他们自己会挖过来。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m13",
    stage: "mid",
    tags: ["screen", "nav"],
    prompt: [
      "你想告诉外面：别从这里挖，这里会塌。",
      "救援的方位可能错了。纠正它，得付出代价。",
    ],
    options: [
      {
        label: "发出一段带方位的警告",
        detail: "说得越具体越救命，也越费电。",
        cost: 150,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这条警告送不出去" },
        ],
      },
      {
        label: "用敲击示警：三下停、三下停",
        detail: "不用电。通用暗号，但说不清具体位置。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不管，反正他们迟早挖到", detail: "不耗电。也许塌不了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m14",
    stage: "mid",
    tags: ["social", "screen"],
    prompt: [
      "有人伤情恶化了。这个消息要不要优先发出去？",
      "一个人的情况撑不了多久。告知外面，也许能换来优先级。",
    ],
    options: [
      {
        label: "优先发伤情，请求医疗优先",
        detail: "内容不多，但这一条可能决定先后顺序。",
        cost: 120,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "network", in: ["weak"], points: -1, note: "弱信号下这条未必能完整发出去" },
        ],
      },
      {
        label: "让身边的人对着手机直接说",
        detail: "不用你打字。省事，也不一定省电。",
        cost: 75,
        tags: ["screen", "social"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "让伤得最重的人自己朝缝隙喊",
        detail: "不用电。喊得动就报上了，喊不动就报不上。",
        cost: 0,
        tags: ["voice", "medical", "risk"],
        gamble: { outcome: "people", points: 1, odds: 0.5, hint: "他还有没有力气喊出去，不好说" },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "伤成这样，喊不出来" },
        ],
      },
    ],
  },
  {
    id: "m15",
    stage: "mid",
    tags: ["light", "risk"],
    prompt: [
      "救援的灯在往别的方向移。他们要走了。",
      "那道光正在离开。你也许只有一次机会把它拽回来。",
    ],
    options: [
      {
        label: "把屏幕调到最亮朝外晃",
        detail: "最亮的一下。能不能被看到，还得看位置。",
        cost: 160,
        tags: ["screen", "light"],
        gamble: { outcome: "light", points: 2, odds: 0.6, hint: "他们是不是正好回头，只能赌" },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天这点光一点用都没有" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里的强光最扎眼" },
        ],
      },
      {
        label: "齐声喊，把所有人的声音凑起来",
        detail: "不用电。人多声音大，但传得有限。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "disaster", in: ["typhoon"], points: -1, note: "风声里喊什么都听不见" },
        ],
      },
      { label: "算了，让他们去别处", detail: "不耗电。也许别处更需要他们。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m16",
    stage: "mid",
    tags: ["paper", "nav"],
    prompt: [
      "你得让后来挖到这里的人知道：下面还有人。",
      "手机会没电。而墙不会。",
    ],
    options: [
      {
        label: "把信息显示在屏幕上，举着别关",
        detail: "最醒目。但屏幕一直亮，掉电肉眼可见。",
        cost: 180,
        tags: ["screen", "light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -1, note: "白天屏幕反而不显眼" },
        ],
      },
      {
        label: "在墙上写大字",
        detail: "不耗电。一直留到有人看见为止。",
        cost: 0,
        tags: ["paper"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "carry", in: ["pen"], points: 1, note: "有笔写得清清楚楚" },
          { key: "carry", in: ["none"], points: -1, note: "没笔，只能用石头划，勉强能认" },
        ],
      },
      { label: "不写了，留着力气喊", detail: "不耗电。也许喊比写有用。", cost: 0, tags: ["voice"] },
    ],
  },
  {
    id: "m17",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "你收到一条：外面已经在挖了，问你要不要保持通话。",
      "保持通话意味着屏幕一直亮着。或者你可以不要它。",
    ],
    options: [
      {
        label: "保持通话，让他们听着挖",
        detail: "最有用的一条线，也是最费电的一条。",
        cost: 210,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 3, odds: 0.5, hint: "电够不够撑到他们挖到，没人知道" },
        env: [
          { key: "network", in: ["weak"], points: -1, note: "弱信号随时掉线" },
          { key: "network", in: ["local"], points: 1, note: "局部网能撑住这条线" },
        ],
      },
      {
        label: "改约每十分钟通一次话",
        detail: "折中。省电，但中间那段时间是盲的。",
        cost: 95,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
      },
      { label: "挂断，省电等他们挖到", detail: "不耗电。挖到了自然会看见你。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m18",
    stage: "mid",
    tags: ["move", "social"],
    prompt: [
      "有人被困在另一头，中间隔着一段要爬的路。",
      "那头有人。过去意味着你要挪动，也要花力气。",
    ],
    options: [
      {
        label: "开手电爬过去",
        detail: "照着爬最快。手电开着在烧电。",
        cost: 140,
        tags: ["light", "move"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["fracture", "bleeding"], points: -1, note: "这个伤爬不过去" },
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里，不烧手机" },
        ],
      },
      {
        label: "隔空喊话约好各自求救",
        detail: "不用电。各自发力，覆盖面更大。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "relay", points: 1 },
      },
      { label: "不过去，守住自己这块", detail: "不耗电。你自己的处境也不稳。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m19",
    stage: "mid",
    tags: ["screen", "nav"],
    prompt: [
      "救援问你：你在哪个房间。而这栋楼你并不熟。",
      "他们需要一个具体的位置。你手里的线索很有限。",
    ],
    options: [
      {
        label: "亮屏定位加门牌一起报",
        detail: "两种信息互相印证，最不容易搞错。",
        cost: 145,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，定位只能靠卫星，飘得厉害" },
        ],
      },
      {
        label: "只报门牌号",
        detail: "便宜。前提是你记得门牌。",
        cost: 35,
        tags: ["nav", "voice"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "让他们自己喊，你回应方位", detail: "不用电。他们喊你答，慢慢缩小范围。", cost: 0, tags: ["voice", "nav"] },
    ],
  },
  {
    id: "m20",
    stage: "mid",
    tags: ["screen", "social"],
    prompt: [
      "你要列出所有人的名字。这条信息出去后，外面就能核对名单。",
      "名字比人数更有用。但打名字要多花不少功夫。",
    ],
    options: [
      {
        label: "逐个问清楚再一起发出去",
        detail: "内容长，发送久。但一个不错。",
        cost: 175,
        tags: ["screen", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "network", in: ["flicker", "weak"], points: -1, note: "这么长的内容最容易断在半路" },
        ],
      },
      {
        label: "只报人数和伤情分级",
        detail: "便宜。够外面调度用，但认不出是谁。",
        cost: 70,
        tags: ["screen"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "让每个人自己朝外面报名字",
        detail: "不用电。喊得动的喊，喊不动的就算了。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "伤重的那几个喊不出来" },
        ],
      },
    ],
  },
  {
    id: "m21",
    stage: "mid",
    tags: ["light", "risk"],
    prompt: [
      "有水渗进来，而且越来越快。你身上唯一怕水的东西在发亮。",
      "水位在涨。手机防水，但防水不等于永远防水。",
    ],
    options: [
      {
        label: "把手机举高固定住，开手电照水位",
        detail: "照着看水位变化。电在花，但你能掌握节奏。",
        cost: 110,
        tags: ["light"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["flood", "typhoon"], points: 1, note: "这种灾里水位就是命" },
          { key: "disaster", in: ["fire"], points: -1, note: "这里没有水，照这个没意义" },
        ],
      },
      {
        label: "把手机塞进衣服里层，先保住它",
        detail: "不用电。保住了设备，但你对水位一无所知。",
        cost: 0,
        tags: ["wait"],
      },
      {
        label: "用手机光标记水面位置在墙上",
        detail: "照一下划一道，之后看墙就知道涨没涨。",
        cost: 55,
        tags: ["light", "paper"],
        gain: { outcome: "position", points: 1 },
      },
    ],
  },
  {
    id: "m22",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "朋友圈和群里有人在转发救援进度。你看到了，但不确定真假。",
      "一条消息在传。照它行动，还是先核实。",
    ],
    options: [
      {
        label: "核实来源再决定",
        detail: "多亮一会儿屏，多刷一次。核实完了心里有底。",
        cost: 100,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 2, odds: 0.55, hint: "能不能查到可靠来源，不好说" },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，核实无从谈起" },
        ],
      },
      {
        label: "照着传的消息调整计划",
        detail: "不用电。万一消息是错的呢。",
        cost: 0,
        tags: ["risk"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不理会，按自己的来", detail: "不耗电。你自己的判断也许更靠谱。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m23",
    stage: "mid",
    tags: ["social", "screen"],
    prompt: [
      "有个人的手机还有一格电，但他不肯交出来。",
      "一台手机就在旁边，属于一个不情愿的人。",
    ],
    options: [
      {
        label: "说服他，合并两台一起用",
        detail: "要花口舌，也未必成。成了就是两条命的电。",
        cost: 40,
        tags: ["social", "voice"],
        gain: { outcome: "relay", points: 2 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你没什么力气说服人了" },
        ],
      },
      {
        label: "不勉强，各自用自己的",
        detail: "不用电。各自为战。",
        cost: 0,
        tags: ["wait"],
      },
      {
        label: "亮屏给他看整体处境，让他自己决定",
        detail: "拿事实说话。亮屏要电。",
        cost: 65,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 1 },
      },
    ],
  },
  {
    id: "m24",
    stage: "mid",
    tags: ["nav", "screen"],
    prompt: [
      "你怀疑救援在往错误的方向挖。证据只有你的耳朵。",
      "一个判断正在成形：他们挖错地方了。说不说？",
    ],
    options: [
      {
        label: "发一段语音描述声音方位",
        detail: "语音比文字省事，但录制和发送都要电。",
        cost: 125,
        tags: ["screen", "voice", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，语音发不出去" },
        ],
      },
      {
        label: "敲管子给他们指方向",
        detail: "不用电。方向能敲明白，细节说不清。",
        cost: 0,
        tags: ["voice", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不确定就别乱说", detail: "不耗电。说错了反而害事。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m25",
    stage: "mid",
    tags: ["screen", "light"],
    prompt: [
      "夜要来了。或者已经在来了。光和声音的价值正在交换。",
      "天色在变。你现在做的选择，到了天黑就不一定管用了。",
    ],
    options: [
      {
        label: "趁天还亮先把消息发出去",
        detail: "趁现在操作方便。也许晚了会后悔。",
        cost: 90,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
        env: [
          { key: "daylight", in: ["dusk", "night"], points: -1, note: "天已经暗了，这一手晚了" },
        ],
      },
      {
        label: "把电留到天黑，那时光最值钱",
        detail: "不耗电。赌后面更值。",
        cost: 0,
        tags: ["wait", "light"],
        env: [
          { key: "daylight", in: ["night"], points: 1, note: "已经黑透了，留下来这一手正对" },
          { key: "daylight", in: ["day"], points: -1, note: "离天黑还早，这么等下去毫无意义" },
        ],
      },
      { label: "照常用，不管天色", detail: "不耗电在等待上，但该花的还是要花。", cost: 60, tags: ["screen"] },
    ],
  },
  {
    id: "m26",
    stage: "mid",
    tags: ["medical", "social"],
    prompt: [
      "有人需要你替他做决定。而他现在说不出话。",
      "一个不能表达的人，把选择权交给了你。",
    ],
    options: [
      {
        label: "替他把情况发出去",
        detail: "你替他说话。电是你出的。",
        cost: 105,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，替他说也送不出去" },
        ],
      },
      {
        label: "把他托付给能说话的人",
        detail: "不用电。转一道手，也许就走样了。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "relay", points: 1 },
      },
      { label: "先顾能救的人", detail: "不耗电。资源有限，总得有取舍。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m27",
    stage: "mid",
    tags: ["screen", "nav"],
    prompt: [
      "你发现手机里存着一张这栋楼的旧照片。也许能帮上忙。",
      "相册里有个东西，你之前完全没想到会派上用场。",
    ],
    options: [
      {
        label: "翻出来对照现场",
        detail: "翻相册加看图，屏幕要亮一阵。",
        cost: 85,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["earthquake", "mudslide"], points: -1, note: "地貌全变了，照片对不上" },
        ],
      },
      {
        label: "描述给别人听，让别人去看",
        detail: "不用电。转述会失真。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "照片是旧的，不看了", detail: "不耗电。旧照片可能误导。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m28",
    stage: "mid",
    tags: ["light", "voice"],
    prompt: [
      "你和外面之间只差一个确认。他们需要知道：这里确实有人。",
      "他们在犹豫要不要继续挖这一片。你要不要给他们一个理由。",
    ],
    options: [
      {
        label: "开手电朝缝隙持续照",
        detail: "持续的光最有说服力。也最费电。",
        cost: 155,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天这光看不见" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里这条光柱很显眼" },
        ],
      },
      {
        label: "敲出「SOS」的节奏",
        detail: "不用电。懂的人一听就懂。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
      },
      { label: "等他们自己决定", detail: "不耗电。也许他们有更全的信息。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m29",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "你正在打字，电掉到了一个让你犹豫的数字。",
      "写到一半，你开始怀疑：这条到底值不值这么多电。",
    ],
    options: [
      {
        label: "写完发出去",
        detail: "既然写了就发完。半途而废最亏。",
        cost: 80,
        tags: ["screen"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "删掉重写成最短的一句",
        detail: "重写还要亮屏。但发出去的概率更高。",
        cost: 50,
        tags: ["screen"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "network", in: ["weak", "flicker"], points: 1, note: "信号不好，短消息反而更容易出去" },
        ],
      },
      { label: "放弃这条，留着电", detail: "不耗电。也许后面还有更要紧的。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m30",
    stage: "mid",
    tags: ["move", "nav"],
    prompt: [
      "你所在的这一处开始积水。留在这里，等于等着被淹。",
      "脚下湿了。挪，还是不挪，现在就得定。",
    ],
    options: [
      {
        label: "开手电找高处再挪过去",
        detail: "照着找最稳。手电开着在烧电。",
        cost: 120,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["flood"], points: 1, note: "洪水里找高处是唯一正确的动作" },
          { key: "injury", in: ["fracture"], points: -1, note: "这个伤挪不动" },
        ],
      },
      {
        label: "摸黑往上爬",
        detail: "不用电。爬错方向的概率不小。",
        cost: 0,
        tags: ["move", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.5, hint: "黑里往上爬，抓到什么全看运气" },
      },
      { label: "原地垫高身体等着", detail: "不耗电。也许水不会再涨了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m31",
    stage: "mid",
    tags: ["screen", "social"],
    prompt: [
      "外面问：你们需要什么。这是一道开放题。",
      "他们让你提要求。提什么，决定他们带什么来。",
    ],
    options: [
      {
        label: "列出药品和器械",
        detail: "内容不少。但说清楚能省下后面很多事。",
        cost: 130,
        tags: ["screen", "medical"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "injury", in: ["fracture", "bleeding"], points: 1, note: "有重伤的时候，这一条最要紧" },
        ],
      },
      {
        label: "只说一句：先挖",
        detail: "便宜。挖开了什么都好说。",
        cost: 30,
        tags: ["screen"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "不提要求，朝外面喊一句就行",
        detail: "不用电。话传到了就算数。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你喊不出那么大声" },
        ],
      },
    ],
  },
  {
    id: "m32",
    stage: "mid",
    tags: ["light", "screen"],
    prompt: [
      "你的手电能照到一小片区域。这一小片里有什么，决定了下一步。",
      "光只有一小圈。这一圈照在哪，你得选。",
    ],
    options: [
      {
        label: "照头顶的结构",
        detail: "先确认会不会塌。活下去才有后面。",
        cost: 95,
        tags: ["light"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["earthquake", "avalanche"], points: 1, note: "这种灾里头顶最要紧" },
          { key: "carry", in: ["torch"], points: 1, note: "手电在你手里，不烧手机" },
        ],
      },
      {
        label: "照地面找能用的东西",
        detail: "工具、水、药。都可能在脚边。",
        cost: 85,
        tags: ["light", "move"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "不照了，摸黑更省", detail: "不耗电。也许摸也能摸到。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m33",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "你想把这段经历记下来。理由是：万一。",
      "有个冲动在说：留下点什么，比发出去更要紧。",
    ],
    options: [
      {
        label: "录一段口述存本地",
        detail: "录音耗电。但它是你的声音。",
        cost: 145,
        tags: ["screen", "voice"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "打字存草稿，不发送",
        detail: "比录音省。留着不发，也许永远不会有人看到。",
        cost: 60,
        tags: ["screen"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "不记了，专心求救", detail: "不耗电。活着出去自己会说。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m34",
    stage: "mid",
    tags: ["social", "voice"],
    prompt: [
      "人群里有人开始抢那台还有电的手机。局面要失控。",
      "秩序正在崩。而秩序崩了，谁都出不去。",
    ],
    options: [
      {
        label: "亮屏宣布分配规则",
        detail: "用可见的权威压住场面。亮屏要电。",
        cost: 70,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "站出来口头压住",
        detail: "不用电。压得住压不住，看你。",
        cost: 0,
        tags: ["voice", "social", "risk"],
        gamble: { outcome: "brief", points: 1, odds: 0.5, hint: "他们听不听你的，不好说" },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你这个样子镇不住人" },
        ],
      },
      { label: "先护住手机躲开", detail: "不耗电。保住设备再说别的。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m35",
    stage: "mid",
    tags: ["nav", "screen"],
    prompt: [
      "你大概知道外面在哪个方向。但「大概」会让救援多挖两小时。",
      "差之毫厘的事，在这里是几条命的差别。",
    ],
    options: [
      {
        label: "开指南针校对方向",
        detail: "传感器不怎么费电。一次就能定死。",
        cost: 40,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "disaster", in: ["avalanche", "mudslide"], points: -1, note: "整片地形都在移动，方位对不上" },
        ],
      },
      {
        label: "靠声音反复定位",
        detail: "不用电。多听几次，误差小一些。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "方向差不多就行", detail: "不耗电。他们挖到了自然会喊。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m36",
    stage: "mid",
    tags: ["screen", "medical"],
    prompt: [
      "你需要知道某个处置对不对。而这个答案，只有外面有。",
      "一个医疗问题卡住了你。查，还是凭直觉。",
    ],
    options: [
      {
        label: "发消息问外面",
        detail: "一来一回两笔开销，还要等。但答案是对的。",
        cost: 115,
        tags: ["screen", "medical"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，问了也白问" },
        ],
      },
      {
        label: "查离线急救手册",
        detail: "不用网，但要亮屏读。",
        cost: 55,
        tags: ["screen", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: 1, note: "离线手册这时候正好" },
        ],
      },
      { label: "凭直觉处理", detail: "不耗电。直觉可能害了你。", cost: 0, tags: ["medical"] },
    ],
  },
  {
    id: "m37",
    stage: "mid",
    tags: ["light", "paper"],
    prompt: [
      "你找到一张纸和一支笔。它们不会耗电。",
      "有笔有纸。这可能是你手里最划算的工具。",
    ],
    options: [
      {
        label: "写清楚全部信息贴在出口处",
        detail: "不耗电。等等——你真的有笔吗。",
        cost: 0,
        tags: ["paper"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "carry", in: ["pen"], points: 1, note: "有笔，写得明明白白" },
          { key: "carry", in: ["none"], points: -1, note: "其实你没笔，只能用指甲划" },
        ],
      },
      {
        label: "先拍照存档再写",
        detail: "双重保险。拍照这笔电花不花，看你。",
        cost: 105,
        tags: ["screen", "paper"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: -1, note: "太黑，拍出来一团糊" },
        ],
      },
      { label: "纸笔留给别人用", detail: "不耗电。也许别人更需要用。", cost: 0, tags: ["social"] },
    ],
  },
  {
    id: "m38",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "有一个号码你拨了一半又挂了。那是报警电话。",
      "要不要把这一下花在最该打的那个号码上。",
    ],
    options: [
      {
        label: "拨出去并说清位置",
        detail: "通话最费电，但接警中心能直接定位。",
        cost: 190,
        tags: ["screen", "risk"],
        gamble: { outcome: "position", points: 2, odds: 0.6, hint: "能不能接通，看线路忙不忙" },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没信号，根本拨不出去" },
          { key: "network", in: ["local"], points: 1, note: "局部网能撑起这一通" },
        ],
      },
      {
        label: "改发短信报警",
        detail: "短信在某些地方能走特殊通道，也便宜得多。",
        cost: 65,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
        env: [
          { key: "network", in: ["weak"], points: 1, note: "弱信号下短信比通话靠谱" },
        ],
      },
      { label: "不打，等他们找到我", detail: "不耗电。也许他们已经在路上了。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m39",
    stage: "mid",
    tags: ["move", "social"],
    prompt: [
      "有人能走，有人走不了。你排的这个顺序会影响所有人。",
      "撤离的顺序要定了。先谁，后谁。",
    ],
    options: [
      {
        label: "按伤情排序，重伤先走",
        detail: "最人道，也最容易引起争议。",
        cost: 0,
        tags: ["social", "medical"],
        gain: { outcome: "brief", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: 1, note: "你自己就是重伤，这条对你有利" },
        ],
      },
      {
        label: "亮屏登记伤情再排序",
        detail: "有据可依，少吵几句。亮屏要电。",
        cost: 90,
        tags: ["screen", "medical", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "让能走的先走，出去再叫人", detail: "不耗电。效率优先。", cost: 0, tags: ["move", "social"] },
    ],
  },
  {
    id: "m40",
    stage: "mid",
    tags: ["screen", "light"],
    prompt: [
      "你注意到屏幕的光能穿过某个缝隙。这是个意外发现。",
      "一道缝，把你的光送到了外面。这也许比发消息有效。",
    ],
    options: [
      {
        label: "把手机卡在缝里常亮",
        detail: "一次投入，持续输出。之后这台手机就废了。",
        cost: 240,
        tags: ["screen", "light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["day"], points: -2, note: "白天这光没人看得见" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里这条缝会亮得很扎眼" },
        ],
      },
      {
        label: "间歇闪，省着用",
        detail: "规律闪烁比常亮省，也更像是人为信号。",
        cost: 110,
        tags: ["light"],
        gain: { outcome: "light", points: 1 },
      },
      { label: "不卡，手机留在身边", detail: "不耗电。也许你还需要它发消息。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m41",
    stage: "mid",
    tags: ["nav", "voice"],
    prompt: [
      "外面在喊一个名字。不是你的。",
      "有人在找另一个人。而你也许知道他在哪。",
    ],
    options: [
      {
        label: "回应并说明那个人在哪",
        detail: "不用电。声音是你唯一免费的东西。",
        cost: 0,
        tags: ["voice", "nav"],
        gain: { outcome: "relay", points: 1 },
        env: [
          { key: "injury", in: ["bleeding"], points: -1, note: "你喊不出那么大声" },
        ],
      },
      {
        label: "亮屏把位置给外面看",
        detail: "说得最清楚，但要花电。",
        cost: 100,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "先不搭话，顾好自己", detail: "不耗电。你也有自己的麻烦。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m42",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "手机提示可以连上一个陌生热点。来历不明。",
      "一个没有密码的网络出现在列表里。连，还是不连。",
    ],
    options: [
      {
        label: "连上试试能不能发出去",
        detail: "搜索加连接都要电。能发出去就赚了。",
        cost: 95,
        tags: ["screen", "risk"],
        gamble: { outcome: "ack", points: 2, odds: 0.5, hint: "这个热点有没有真通道，说不准" },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "整片都断了，热点多半也是死的" },
          { key: "network", in: ["local", "flicker"], points: 1, note: "周边还有活的网络，值得一试" },
        ],
      },
      {
        label: "不连，来历不明的网别碰",
        detail: "不用电。稳妥，但也许错过唯一的机会。",
        cost: 0,
        tags: ["wait"],
      },
      { label: "先问周围人这是谁的网", detail: "不耗电。问到了也许能放心连。", cost: 0, tags: ["social", "voice"] },
    ],
  },
  {
    id: "m43",
    stage: "mid",
    tags: ["medical", "light"],
    prompt: [
      "你在给别人止血。手在抖，光不够。",
      "这一下做对了，就是一条命。做错了，也是。",
    ],
    options: [
      {
        label: "开手电照着处理",
        detail: "照清楚了才做得对。电在花，命也在抢。",
        cost: 80,
        tags: ["light", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          { key: "daylight", in: ["day"], points: -1, note: "白天有光，开手电多余" },
          { key: "daylight", in: ["night"], points: 1, note: "夜里没有这一下根本做不了" },
          { key: "injury", in: ["bleeding"], points: 1, note: "就是这种情况需要它" },
        ],
      },
      {
        label: "摸黑凭手感压住",
        detail: "不用电。压得住就行，压不准就坏事。",
        cost: 0,
        tags: ["medical"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "让别人来，你省着力气", detail: "不耗电。别人未必做得比你差。", cost: 0, tags: ["social"] },
    ],
  },
  {
    id: "m44",
    stage: "mid",
    tags: ["screen", "social"],
    prompt: [
      "你想让外面知道：这里的人还活着，而且还在动。",
      "一条「我们还活着」，值不值这个价。",
    ],
    options: [
      {
        label: "发一条状态更新，附时间",
        detail: "带上时间戳，外面能推算恶化速度。",
        cost: 85,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -2, note: "没网，这条出不去" },
        ],
      },
      {
        label: "让所有人一起喊一声",
        detail: "不用电。喊一次，外面就知道不是一个人。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
      },
      { label: "不发，等到有变化再发", detail: "不耗电。没变化发什么都一样。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m45",
    stage: "mid",
    tags: ["nav", "screen"],
    prompt: [
      "你发现救援的进度比你想的慢。慢到可能需要重新安排。",
      "现实在逼你重算一遍：剩下的电够撑到什么时候。",
    ],
    options: [
      {
        label: "查一下外部进展重算时间",
        detail: "亮屏刷一次。知道底细才好安排。",
        cost: 90,
        tags: ["screen", "nav"],
        gain: { outcome: "ack", points: 1 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，什么也刷不出来" },
        ],
      },
      {
        label: "按最坏情况安排，不查了",
        detail: "不用电。保守，但不会失控。",
        cost: 0,
        tags: ["wait"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "把电集中在一件事上，其余全放弃", detail: "不耗电。孤注一掷也是一种安排。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m46",
    stage: "mid",
    tags: ["light", "social"],
    prompt: [
      "黑暗里有人把你的手机当成了公共财产。",
      "这台手机是你的。但在这个空间里，「你的」这个概念正在失效。",
    ],
    options: [
      {
        label: "明确宣布分配：每人一条，你来执行",
        detail: "不用电。话说出口就要做到。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "亮屏让大家看着电量说话",
        detail: "让数字说话最有力。亮屏要电。",
        cost: 45,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      { label: "不宣布，谁抢到算谁的", detail: "不耗电。也许这样最快。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m47",
    stage: "mid",
    tags: ["screen", "nav"],
    prompt: [
      "你有个机会把坐标发出去。但那要打开一个很耗电的功能。",
      "精确坐标是有代价的。而这个代价，也可能是划算的。",
    ],
    options: [
      {
        label: "开高精度定位取坐标",
        detail: "最准。也是最贵的一种取法。",
        cost: 165,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["dead"], points: -1, note: "没网，只能靠卫星，慢且飘" },
          { key: "network", in: ["local"], points: 1, note: "有网辅助，又快又准" },
        ],
      },
      {
        label: "用低精度定位，省一大半",
        detail: "误差大些，但足够他们圈出一片。",
        cost: 60,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不取坐标，改用描述", detail: "不耗电。「三层东侧」也许就够了。", cost: 0, tags: ["voice", "nav"] },
    ],
  },
  {
    id: "m48",
    stage: "mid",
    tags: ["risk", "voice"],
    prompt: [
      "外面安静了很久。安静可能是好事，也可能是他们走了。",
      "一个判断摆在你面前：要不要主动打破这份安静。",
    ],
    options: [
      {
        label: "敲一排响的，把动静做出来",
        detail: "不用电。动静大了，也许招来的不只是救援。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: { outcome: "light", points: 2, odds: 0.55, hint: "会不会引来二次塌方，不好说" },
        env: [
          { key: "disaster", in: ["earthquake", "avalanche"], points: -1, note: "这种结构最经不起震动" },
        ],
      },
      {
        label: "开手电静静照着，不发声",
        detail: "安静但持续。电在花。",
        cost: 120,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          { key: "daylight", in: ["night"], points: 1, note: "夜里这束静光很显眼" },
          { key: "daylight", in: ["day"], points: -2, note: "白天照了也白照" },
        ],
      },
      { label: "跟着一起安静，等", detail: "不耗电。也许安静是对的。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m49",
    stage: "mid",
    tags: ["screen", "social"],
    prompt: [
      "你收到一张照片：外面的人发来的，是他们挖到的位置。",
      "一张图胜过千言万语。前提是你看得起这一下。",
    ],
    options: [
      {
        label: "下载看清细节",
        detail: "图片下载最费电。但你能看到他们到底挖到哪了。",
        cost: 135,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          { key: "network", in: ["weak", "flicker"], points: -1, note: "弱网下图最容易下到一半卡住" },
          { key: "network", in: ["dead"], points: -2, note: "没网，图根本下不来" },
        ],
      },
      {
        label: "只看缩略图，猜个大概",
        detail: "便宜。猜错的概率不小。",
        cost: 40,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
      },
      { label: "不看了，让他们发文字", detail: "文字更省。但他们未必会再发一次。", cost: 0, tags: ["wait"] },
    ],
  },
  {
    id: "m50",
    stage: "mid",
    tags: ["light", "nav"],
    prompt: [
      "天光在变。你能感觉到，但看不见。",
      "你对时间的感知已经不准了。而时间决定了你该用什么信号。",
    ],
    options: [
      {
        label: "亮屏确认时间",
        detail: "最便宜的一次亮屏。值不值，看你信不信自己的感觉。",
        cost: 20,
        tags: ["screen"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "daylight", in: ["day"], points: -1, note: "外面亮得很，根本不用看时间" },
          { key: "daylight", in: ["night"], points: 1, note: "黑透了，这一下能告诉你还要熬多久" },
        ],
      },
      {
        label: "从缝隙判断天色",
        detail: "不用电。看不见就白搭。",
        cost: 0,
        tags: ["nav", "light"],
        gain: { outcome: "light", points: 1 },
        env: [
          { key: "daylight", in: ["night"], points: -1, note: "外面黑成了这样，看也是白看" },
        ],
      },
      { label: "时间不重要，凭感觉来", detail: "不耗电。感觉未必差。", cost: 0, tags: ["wait"] },
    ],
  },
];
