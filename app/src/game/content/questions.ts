import type { Question } from "../types";
import { EARLY_EXTRA } from "./bank/early";
import { MID_EXTRA } from "./bank/mid";
import { LATE_EXTRA } from "./bank/late";

/**
 * 题库。一局随机抽 10 道（早 3 / 中 4 / 晚 3），题库越大越难被背下来。
 *
 * 三条写作规矩：
 * 1. 题干不写死数字，只写局面；成本与收益由规则算，不由文案吹。
 * 2. 同一选项在不同环境下的收益必须不同（env），否则会出现「永远选它」。
 * 3. gamble 只在真的不确定时用，且成败由本局种子预先抽定——玩家与 Ghost 抽到同一个结果，
 *    所以运气不构成对照差异，差异只来自选择。
 */
const BASE: Question[] = [
  // ───────────────────────── 早期：先把处境弄清楚 ─────────────────────────
  {
    id: "e01",
    stage: "early",
    tags: ["screen", "nav"],
    prompt: [
      "你从瓦砾里摸出手机，屏幕裂了一道。信号栏空着。第一件事，是弄明白自己在哪。",
      "手机还能亮。你不知道自己被埋在哪一堆下面，也不知道外面有没有人在找。",
      "醒过来的时候天还没亮透。你手里唯一有电的东西，是这部只剩一点的手机。",
    ],
    options: [
      {
        label: "开地图定位",
        detail: "亮屏定位，耗电最多的一种查法，但结果最准。",
        cost: 180,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 3 },
        env: [
          {
            key: "network",
            in: ["dead"],
            points: -1,
            note: "没有网络，定位只能靠存过的离线地图，差了一档",
          },
          {
            key: "daylight",
            in: ["day"],
            points: 1,
            note: "天光够亮，对照地物省下一道功夫",
          },
        ],
      },
      {
        label: "凭记忆判断方位",
        detail: "不开屏，靠听声和风向往外推。几乎不耗电。",
        cost: 20,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "disaster",
            in: ["earthquake", "mudslide"],
            points: -1,
            note: "地貌全变了，记忆里的参照物一个都对不上",
          },
        ],
      },
      {
        label: "先喊两声试试",
        detail: "不耗电。有人应声就知道方位，没人应就白喊。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: {
          outcome: "position",
          points: 2,
          odds: 0.5,
          hint: "附近有没有活人，现在谁也说不准",
        },
        env: [
          {
            key: "injury",
            in: ["fracture", "bleeding"],
            points: -2,
            note: "你这个状态喊不了多大声音",
          },
          {
            key: "daylight",
            in: ["night"],
            points: 1,
            note: "夜里安静，声音传得远",
          },
        ],
      },
    ],
  },
  {
    id: "e02",
    stage: "early",
    tags: ["social"],
    prompt: [
      "黑暗里有人在咳嗽，不只一个。你还没数清身边有几个人。",
      "旁边有动静。你听得出来不止一个人，但具体几个，说不上来。",
      "有人在低声说话。你意识到一个事实：你不是唯一被困住的。",
    ],
    options: [
      {
        label: "点亮屏幕数一遍",
        detail: "最快最准，但屏幕一亮就是一笔不小的开销。",
        cost: 90,
        tags: ["screen", "social"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "挨个问过去",
        detail: "不用电，靠嘴。慢一点，但也能问清楚。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          {
            key: "injury",
            in: ["bleeding"],
            points: -1,
            note: "你说不了太多话",
          },
        ],
      },
      {
        label: "先不管，省下这点电",
        detail: "人数晚点再数。现在每一格电都可能是救命的。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "e03",
    stage: "early",
    tags: ["screen", "risk"],
    prompt: [
      "信号栏偶尔跳一下，又掉回去。你想知道外面现在是什么情况。",
      "手机顶上的信号时有时无。外面到底怎样了，你一点底都没有。",
      "有那么一瞬间，你好像看见一格信号。想确认，就得赌这一下。",
    ],
    options: [
      {
        label: "试着刷一次消息",
        detail: "能刷出来就赚到，刷不出来电也花了。",
        cost: 120,
        tags: ["screen", "risk"],
        gamble: {
          outcome: "ack",
          points: 2,
          odds: 0.45,
          hint: "信号能不能撑到加载完，谁也不敢打包票",
        },
        env: [
          {
            key: "network",
            in: ["dead"],
            points: -2,
            note: "网络彻底断了，这一下多半白费",
          },
          {
            key: "network",
            in: ["local"],
            points: 1,
            note: "局部还有网，比想象中好办",
          },
        ],
      },
      {
        label: "只发一条求救短信",
        detail: "不求回音，只求发出去。发出去就算数。",
        cost: 70,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "network",
            in: ["flicker", "local"],
            points: 1,
            note: "断续的网络足够把短信推出去",
          },
        ],
      },
      {
        label: "关屏等信号自己回来",
        detail: "不花电。等下去可能会错过，也可能等到更好的时机。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "e04",
    stage: "early",
    tags: ["medical"],
    prompt: [
      "你试着动了动腿。疼。但你得先决定要不要管它。",
      "身上有地方在疼。现在处理，还是先顾别的？",
      "血顺着小腿流下来。你知道该处理，可处理要花时间也要花电。",
    ],
    options: [
      {
        label: "开手电查看伤势",
        detail: "看得清才能处理对。手电一亮就是开销。",
        cost: 60,
        tags: ["light", "medical"],
        gain: { outcome: "people", points: 1 },
        env: [
          {
            key: "daylight",
            in: ["day"],
            points: -1,
            note: "大白天开手电，纯属浪费",
          },
          {
            key: "daylight",
            in: ["night"],
            points: 1,
            note: "夜里这一下照得值",
          },
        ],
      },
      {
        label: "摸黑先按住止血",
        detail: "不用电。凭手感处理，未必处理得对。",
        cost: 0,
        tags: ["medical"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "先不管伤，抓紧时间",
        detail: "伤可以拖，时机拖不得。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "e05",
    stage: "early",
    tags: ["move"],
    prompt: [
      "头顶那块楼板在响。留在原地还是挪一挪，你得拿主意。",
      "你所在的位置似乎不太稳。挪，还是不挪？",
      "有水声从下面传上来，而且越来越近。",
    ],
    options: [
      {
        label: "开手电找一条出路",
        detail: "照着走最稳，但手电开着就在烧电。",
        cost: 110,
        tags: ["light", "move"],
        gain: { outcome: "position", points: 2 },
        env: [
          {
            key: "carry",
            in: ["torch"],
            points: 1,
            note: "你带了手电，不用烧手机的电",
          },
          {
            key: "disaster",
            in: ["avalanche", "mudslide"],
            points: -1,
            note: "这种地形，照得再亮也未必找得到路",
          },
        ],
      },
      {
        label: "摸黑挪到听起来更结实的地方",
        detail: "不耗电。靠手和耳朵探路。",
        cost: 0,
        tags: ["move"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "injury",
            in: ["fracture"],
            points: -1,
            note: "这个伤，摸黑挪动不太现实",
          },
        ],
      },
      {
        label: "原地不动，保存体力",
        detail: "什么都不做。也许救援先找到的就是不动的人。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "e06",
    stage: "early",
    tags: ["nav", "screen"],
    prompt: [
      "你记得附近有个避难场所，但记不清在哪一头。",
      "往哪边走才有人？这个问题现在还没有答案。",
      "两个方向，一条通往开阔地，一条通往更深的里面。",
    ],
    options: [
      {
        label: "查一下离线地图",
        detail: "存过的地图不用网络也能看，但屏幕得亮一会儿。",
        cost: 100,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          {
            key: "network",
            in: ["dead"],
            points: 1,
            note: "离线地图正好用得上，反而不吃亏",
          },
        ],
      },
      {
        label: "朝有风的方向走",
        detail: "不用电。风从哪来，通常意味着那边有出口。",
        cost: 0,
        tags: ["move", "nav"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "disaster",
            in: ["fire"],
            points: -1,
            note: "火场里的风向会骗人",
          },
        ],
      },
      {
        label: "把选择权交给身边的人",
        detail: "让别人拿主意。你不花电，也不担责任。",
        cost: 0,
        tags: ["social", "wait"],
      },
    ],
  },
  {
    id: "e07",
    stage: "early",
    tags: ["screen", "nav"],
    prompt: [
      "手机还剩最后一点。你想给它留一条后路。",
      "在彻底没电之前，是不是该先把最要紧的东西存下来？",
      "有个念头冒出来：现在省一格，后面可能就多一条命。",
    ],
    options: [
      {
        label: "打开省电模式并关掉后台",
        detail: "一次性设置，之后每次操作都能省一点。",
        cost: 30,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
      },
      {
        label: "把屏幕亮度压到最低",
        detail: "牺牲可读性换电量。后面每一次亮屏都会便宜些。",
        cost: 20,
        tags: ["screen"],
        gain: { outcome: "light", points: 1 },
        env: [
          {
            key: "daylight",
            in: ["day"],
            points: -1,
            note: "白天压太暗，等于什么也看不见",
          },
        ],
      },
      {
        label: "什么都不调，先办事",
        detail: "设置可以以后再说。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "e08",
    stage: "early",
    tags: ["social", "voice"],
    prompt: [
      "身边那位一直在哭。你开口，还是不开口？",
      "有人在旁边反复念叨同一句话。他知道的可能比你多。",
      "黑暗里有人问你：我们会不会死在这儿。",
    ],
    options: [
      {
        label: "跟他说话，稳住他",
        detail: "不耗电。稳住的人能帮上忙，慌掉的人只能添乱。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
        env: [
          {
            key: "injury",
            in: ["bleeding"],
            points: -1,
            note: "你自己也说不动了",
          },
        ],
      },
      {
        label: "问他知道些什么",
        detail: "不耗电。也许他见过出口，也许他知道还有谁在。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "先不说话，专心想自己的事",
        detail: "沉默也是一种选择。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },

  // ───────────────────────── 中期：把消息送出去 ─────────────────────────
  {
    id: "m01",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "信号栏跳了两下。这一次要不要发，就看你怎么想了。",
      "外面有人在找——如果你现在发出去，他们就知道往哪挖。",
      "你攒了一条最要紧的话，一直没舍得发。现在到了要发的时候。",
    ],
    options: [
      {
        label: "把位置和人数一起发出去",
        detail: "一次说完最省，但内容多，发送时间也长。",
        cost: 200,
        tags: ["screen"],
        gain: { outcome: "position", points: 2 },
        env: [
          {
            key: "network",
            in: ["flicker"],
            points: -1,
            note: "网络断断续续，长消息最容易半途断掉",
          },
        ],
      },
      {
        label: "只发位置",
        detail: "短，容易发出去。人数后面再说。",
        cost: 110,
        tags: ["screen"],
        gain: { outcome: "position", points: 2 },
      },
      {
        label: "再等一格信号",
        detail: "不耗电。等信号更好一点，也许能一次发全。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "m02",
    stage: "mid",
    tags: ["light"],
    prompt: [
      "外面有人拿着灯在扫。你现在要做的，是让他看见你。",
      "远处有光在动。那可能是救援，也可能只是别的幸存者的手机。",
      "你和外面之间只隔着一层废墟。而这层废墟，光能穿过去。",
    ],
    options: [
      {
        label: "开手电常亮",
        detail: "持续照着，最容易被发现，也最费电。",
        cost: 150,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          {
            key: "daylight",
            in: ["day"],
            points: -2,
            note: "大白天的手电，外面根本看不见",
          },
          {
            key: "daylight",
            in: ["night"],
            points: 1,
            note: "夜里这一点光能传很远",
          },
        ],
      },
      {
        label: "闪三下",
        detail: "短促，省电。但对方可能刚好没在看这边。",
        cost: 40,
        tags: ["light", "risk"],
        gamble: {
          outcome: "light",
          points: 2,
          odds: 0.55,
          hint: "对方是不是正好朝这边看，只能赌",
        },
      },
      {
        label: "敲管子，不用电",
        detail: "声音能传，但传不了那么远。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
      },
    ],
  },
  {
    id: "m03",
    stage: "mid",
    tags: ["paper", "social"],
    prompt: [
      "你得让身边的人知道接下来怎么办。而你的手机，只剩一点点了。",
      "有人问你：接下来我们怎么做？这个问题你得回答。",
      "安排已经在你脑子里。问题是：怎么让它留下来。",
    ],
    options: [
      {
        label: "亮屏给大家看",
        detail: "最快最直观。但屏幕一亮，电就走一格。",
        cost: 130,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "口头交代一遍",
        detail: "不用电，十秒说完。但没人手里留下凭据。",
        cost: 0,
        tags: ["voice", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          {
            key: "injury",
            in: ["bleeding"],
            points: -1,
            note: "你说不完整",
          },
        ],
      },
      {
        label: "写下来传阅",
        detail: "不耗电。慢，但纸条会在你手机没电之后继续起作用。",
        cost: 0,
        tags: ["paper", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          {
            key: "carry",
            in: ["pen"],
            points: 1,
            note: "你带了纸笔，写下来格外清楚",
          },
          {
            key: "carry",
            in: ["none"],
            points: -1,
            note: "没有纸笔，只能靠比划，说不清",
          },
        ],
      },
    ],
  },
  {
    id: "m04",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "你收到了一条回信。只有几个字：「你们还在吗？」",
      "对方在确认。你回不回，回什么，都是一次开销。",
      "外面的人在等一句话。这句话值多少电，你说了算。",
    ],
    options: [
      {
        label: "回复确认，并附上人数",
        detail: "内容多，发得久，但对方一次就全清楚了。",
        cost: 170,
        tags: ["screen"],
        gain: { outcome: "ack", points: 3 },
        env: [
          {
            key: "network",
            in: ["weak"],
            points: -1,
            note: "信号太弱，长回复很可能发一半就断",
          },
        ],
      },
      {
        label: "只回一个字：在",
        detail: "短，几乎一定能发出去。",
        cost: 60,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
      },
      {
        label: "先不回，留着电",
        detail: "也许后面还有更要紧的话要说。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "m05",
    stage: "mid",
    tags: ["move", "risk"],
    prompt: [
      "你听见有人在更深处喊。去，还是不去？",
      "那声音越来越弱了。你知道过去要花力气，也花电。",
      "有人被困在更里面。你的手机是你唯一的工具。",
    ],
    options: [
      {
        label: "开手电过去看看",
        detail: "照着走能快些，但路不好说。",
        cost: 140,
        tags: ["light", "move"],
        gain: { outcome: "people", points: 1 },
        env: [
          {
            key: "injury",
            in: ["fracture", "bleeding"],
            points: -1,
            note: "你这个状态过不去",
          },
        ],
      },
      {
        label: "朝那边喊话，让他自己往外挪",
        detail: "不耗电。能不能听懂、能不能动，就看他了。",
        cost: 0,
        tags: ["voice", "risk"],
        gamble: {
          outcome: "people",
          points: 1,
          odds: 0.6,
          hint: "他还有没有力气回应，不好说",
        },
      },
      {
        label: "先顾好自己这边",
        detail: "不去。也许那边本来就没救了。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "m06",
    stage: "mid",
    tags: ["screen", "nav"],
    prompt: [
      "你想确认一下：他们到底挖到哪儿了。",
      "外面机器响了很久了。你想知道那个声音离你有多近。",
      "有个办法能知道救援进度，但那要亮屏。",
    ],
    options: [
      {
        label: "查一下官方通报",
        detail: "能看到大范围进展，但那是别人的进度，不是你的。",
        cost: 120,
        tags: ["screen", "nav"],
        gain: { outcome: "ack", points: 1 },
        env: [
          {
            key: "network",
            in: ["dead"],
            points: -1,
            note: "没网，什么也刷不出来",
          },
        ],
      },
      {
        label: "仔细听机器的方位",
        detail: "不用电。听出来的准头有限，但至少不花代价。",
        cost: 0,
        tags: ["nav"],
        gain: { outcome: "position", points: 1 },
      },
      {
        label: "不问了，留着电做别的",
        detail: "知道进度也改变不了什么。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "m07",
    stage: "mid",
    tags: ["screen", "light"],
    prompt: [
      "你想给外面的人留一个记号，让他们知道这里有人。",
      "等救援挖到这儿的时候，最好能一眼看出下面有人。",
      "有个东西可以当信号用，就看你怎么用。",
    ],
    options: [
      {
        label: "把手机屏保设成最亮常亮",
        detail: "一直亮着最显眼，但那是以肉眼可见的速度掉电。",
        cost: 220,
        tags: ["screen", "light"],
        gain: { outcome: "light", points: 2 },
        env: [
          {
            key: "daylight",
            in: ["day"],
            points: -2,
            note: "白天这块屏幕一点都不起眼",
          },
        ],
      },
      {
        label: "把手机挂在显眼处反光",
        detail: "不耗电。靠外部的光反射，效果看运气。",
        cost: 0,
        tags: ["light", "risk"],
        gamble: {
          outcome: "light",
          points: 2,
          odds: 0.5,
          hint: "有没有光能正好照到它，说不准",
        },
      },
      {
        label: "在墙上敲出规律的声音",
        detail: "不耗电。节奏对了，外面的救援听得懂。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
      },
    ],
  },
  {
    id: "m08",
    stage: "mid",
    tags: ["social", "risk"],
    prompt: [
      "身边那位说自己手机还有百分之十几。他想借你的用一下。",
      "有人凑过来说：我这台彻底没电了，你的能不能借我发一条。",
      "一个不认识的人问你要不要交换设备——他的电比你多，但屏幕碎得看不清。",
    ],
    options: [
      {
        label: "借给他发一条",
        detail: "电是你出的，成果算大家的。",
        cost: 90,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 2 },
      },
      {
        label: "不借，但让他用嘴说，你代发",
        detail: "你来控制发什么，电还是你出。",
        cost: 70,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 1 },
      },
      {
        label: "婉拒",
        detail: "这点电你得留给自己。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "m09",
    stage: "mid",
    tags: ["screen", "risk"],
    prompt: [
      "温度在往下掉。你开始担心另一件事：低温会让电池掉得更快。",
      "手机贴着身体还是凉的。你知道这意味着什么。",
      "有件事现在不做，等会儿可能就做不了了。",
    ],
    options: [
      {
        label: "把手机贴身捂热再操作",
        detail: "不耗电，还能捡回一点效率。但要花时间。",
        cost: 30,
        tags: ["wait"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "temp",
            in: ["freezing"],
            points: 1,
            note: "严寒下这一手最管用",
          },
          {
            key: "temp",
            in: ["sultry"],
            points: -1,
            note: "本来就热，捂着反而更糟",
          },
        ],
      },
      {
        label: "不管温度，赶紧发",
        detail: "趁现在还有电，先把要紧的办了。",
        cost: 100,
        tags: ["screen"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "temp",
            in: ["freezing"],
            points: -1,
            note: "冻透的电池撑不住这么一下",
          },
        ],
      },
      {
        label: "先关机保住余量",
        detail: "彻底不动。也许能撑到被挖出来那一刻。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "m10",
    stage: "mid",
    tags: ["nav", "screen"],
    prompt: [
      "你大概知道自己在哪一层。但「大概」不够。",
      "救援会问：你在几层，哪个位置。你得答得上来。",
      "一个具体的坐标，比一百句描述都管用。",
    ],
    options: [
      {
        label: "开定位取一次精确坐标",
        detail: "一次到位。代价不小。",
        cost: 150,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
        env: [
          {
            key: "network",
            in: ["dead"],
            points: -1,
            note: "没网，只能靠卫星，慢且不准",
          },
        ],
      },
      {
        label: "数楼层、记门牌，口头报出去",
        detail: "不用电。慢，也许不准，但总比没有强。",
        cost: 40,
        tags: ["nav", "voice"],
        gain: { outcome: "position", points: 1 },
      },
      {
        label: "把位置写在墙上",
        detail: "不耗电。等有人挖到这里，自然会看见。",
        cost: 0,
        tags: ["paper"],
        gain: { outcome: "position", points: 1 },
        env: [
          {
            key: "carry",
            in: ["pen"],
            points: 1,
            note: "有笔就写得清楚",
          },
        ],
      },
    ],
  },

  // ───────────────────────── 后期：余量留给谁 ─────────────────────────
  {
    id: "l01",
    stage: "late",
    tags: ["social"],
    prompt: [
      "身边的人里，有一个伤得比你重。他的手机早就黑了。",
      "现在的问题只剩一个：剩下的这点电，给谁用。",
      "你手指划过最后几格电。这一次之后，也许就真的没了。",
    ],
    options: [
      {
        label: "把设备让给他，让他发一条",
        detail: "他能把消息送出去。从此本轮再没有你的操作。",
        cost: 200,
        tags: ["social"],
        gain: { outcome: "relay", points: 2 },
        env: [
          {
            key: "injury",
            in: ["bleeding"],
            points: -1,
            note: "你自己这个状态，未必递得过去",
          },
        ],
      },
      {
        label: "帮他发，但设备留着",
        detail: "你替他把话发出去。电是你花的，权也在你手里。",
        cost: 120,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 1 },
      },
      {
        label: "留给自己",
        detail: "也许你自己还需要最后一下。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "l02",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "最后一次机会。信号在，或者不在，就这一下。",
      "你想说的还有一句。这一句发出去，这局就结束了。",
      "屏幕上弹出低电量警告。你知道，该做最后一个决定了。",
    ],
    options: [
      {
        label: "发出最后一条完整信息",
        detail: "把最要紧的一次说完。成败在此一举。",
        cost: 180,
        tags: ["screen", "risk"],
        gamble: {
          outcome: "ack",
          points: 3,
          odds: 0.55,
          hint: "电够不够撑到发完，现在没人知道",
        },
        env: [
          {
            key: "network",
            in: ["weak"],
            points: -1,
            note: "信号太弱，长消息容易断在半路",
          },
        ],
      },
      {
        label: "发一句最短的",
        detail: "短的成功率高，但说不了多少事。",
        cost: 60,
        tags: ["screen"],
        gain: { outcome: "ack", points: 2 },
      },
      {
        label: "关机，把余量留到被找到那一刻",
        detail: "不发了。也许活着被挖出来，比一条消息更有用。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "l03",
    stage: "late",
    tags: ["light", "risk"],
    prompt: [
      "外面安静下来了。你不确定他们还在不在挖。",
      "最后一格电，可以换成最后一次光。",
      "如果这是最后一次能被看见的机会，你要不要用它。",
    ],
    options: [
      {
        label: "把剩下的电全换成一次长亮",
        detail: "最亮的一次。之后这台手机就彻底黑了。",
        cost: 250,
        tags: ["light"],
        gain: { outcome: "light", points: 2 },
        env: [
          {
            key: "daylight",
            in: ["day"],
            points: -2,
            note: "白天这一点光白费",
          },
          {
            key: "daylight",
            in: ["night", "dusk"],
            points: 1,
            note: "天暗下来之后，这才是最响的呼救",
          },
        ],
      },
      {
        label: "留着，等到听见声音再亮",
        detail: "不耗电。等一个最值的时候。",
        cost: 0,
        tags: ["wait", "light"],
      },
      {
        label: "改用敲打，把电省下来",
        detail: "不耗电。声音传不了光那么远，但不用代价。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "light", points: 1 },
      },
    ],
  },
  {
    id: "l04",
    stage: "late",
    tags: ["social", "paper"],
    prompt: [
      "你的手机快没了。但有些话，得留到以后。",
      "如果有人后来翻开这里，你希望他们看到什么？",
      "这台手机撑不了多久了。可你想留下的东西，未必只有消息。",
    ],
    options: [
      {
        label: "录一段话存起来",
        detail: "录音比文字耗，但那是你的声音。",
        cost: 160,
        tags: ["screen", "social"],
        gain: { outcome: "brief", points: 1 },
      },
      {
        label: "把要说的话写在纸上",
        detail: "不耗电。纸条会留得比手机久得多。",
        cost: 0,
        tags: ["paper", "social"],
        gain: { outcome: "brief", points: 1 },
        env: [
          {
            key: "carry",
            in: ["pen"],
            points: 1,
            note: "有笔，能写得清楚",
          },
          {
            key: "carry",
            in: ["none"],
            points: -1,
            note: "没有笔，只能口述给别人记",
          },
        ],
      },
      {
        label: "什么都不留",
        detail: "也许活下来本身，就是最好的交代。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "l05",
    stage: "late",
    tags: ["screen", "nav"],
    prompt: [
      "救援的声音近了，但他们问的问题你还没答完。",
      "他们在喊：下面有几个人。这一个问题，值多少电？",
      "最后一道题：把剩下的电，换成他们最需要的一个答案。",
    ],
    options: [
      {
        label: "报出准确人数",
        detail: "他们最想知道的，就是有几个要挖。",
        cost: 90,
        tags: ["screen", "voice"],
        gain: { outcome: "people", points: 1 },
      },
      {
        label: "报出你的精确位置",
        detail: "位置决定他们往哪挖，也许人数更次要。",
        cost: 110,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 2 },
      },
      {
        label: "朝上面喊，不用电",
        detail: "不耗电。他们听得见就行。",
        cost: 0,
        tags: ["voice"],
        gain: { outcome: "people", points: 1 },
        env: [
          {
            key: "injury",
            in: ["bleeding", "fracture"],
            points: -1,
            note: "你喊不出那么大声音",
          },
        ],
      },
    ],
  },
  {
    id: "l06",
    stage: "late",
    tags: ["screen", "risk"],
    prompt: [
      "有个号码你一直没拨。现在拨，还是不拨？",
      "那一个号码按下去，也许就再没有第二次机会了。",
      "你想打给一个人。而这一下会花掉你剩下的大半电量。",
    ],
    options: [
      {
        label: "拨出去",
        detail: "通不通看命。但至少你试过了。",
        cost: 150,
        tags: ["screen", "risk"],
        gamble: {
          outcome: "ack",
          points: 2,
          odds: 0.5,
          hint: "那边接不接得起来，谁也说不准",
        },
        env: [
          {
            key: "network",
            in: ["dead"],
            points: -2,
            note: "没信号，这一下必然落空",
          },
        ],
      },
      {
        label: "改成发一条短信",
        detail: "短信比通话省，也不要求对方马上接。",
        cost: 70,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
      {
        label: "不打了",
        detail: "有些话，也许本来就打不通。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "l07",
    stage: "late",
    tags: ["social", "move"],
    prompt: [
      "你这边基本稳了。隔壁那堆瓦砾下面，还有动静。",
      "救援先到了你这边。而你知道，隔壁还有人。",
      "最后一个决定：是让人先救你，还是先指给他们隔壁在哪。",
    ],
    options: [
      {
        label: "先指给他们隔壁的位置",
        detail: "不耗电。但你自己就要多等一会儿。",
        cost: 0,
        tags: ["social", "nav"],
        gain: { outcome: "relay", points: 1 },
        env: [
          {
            key: "injury",
            in: ["bleeding"],
            points: -1,
            note: "你等不起",
          },
        ],
      },
      {
        label: "亮屏给他们看手机上的定位",
        detail: "说得最清楚，但要花电。",
        cost: 80,
        tags: ["screen", "nav"],
        gain: { outcome: "position", points: 1 },
      },
      {
        label: "先顾自己出去",
        detail: "你已经撑到极限了。",
        cost: 0,
        tags: ["wait"],
      },
    ],
  },
  {
    id: "l08",
    stage: "late",
    tags: ["screen", "social"],
    prompt: [
      "有人递过来一台还有电的手机。条件是：你得先帮他们发一条。",
      "一台陌生的手机，电量比你多。你接，还是不接？",
      "最后一件事：要不要接受这台设备。",
    ],
    options: [
      {
        label: "接过来，用它的电发完这局最后一条",
        detail: "借来的电不扣你的账，但成果记在你名下。",
        cost: 20,
        tags: ["screen", "social"],
        gain: { outcome: "relay", points: 1 },
      },
      {
        label: "接过来，但先给伤重的人用",
        detail: "你一分不花，成果算别人的。",
        cost: 0,
        tags: ["social"],
        gain: { outcome: "relay", points: 1 },
      },
      {
        label: "不接，用自己的把话说完",
        detail: "自己的电，自己说了算。",
        cost: 100,
        tags: ["screen"],
        gain: { outcome: "ack", points: 1 },
      },
    ],
  },
];

/** 全部题目：基础题 + 早/中/晚三个扩充包。 */
export const QUESTIONS: Question[] = [
  ...BASE,
  ...EARLY_EXTRA,
  ...MID_EXTRA,
  ...LATE_EXTRA,
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export function questionsByStage(stage: Question["stage"]): Question[] {
  return QUESTIONS.filter((q) => q.stage === stage);
}
