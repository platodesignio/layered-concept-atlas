// seed.mjs - ES Module seed script for direct node execution
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LAYERS = [
  { index: 0, slug: "l0", nameJa: "L0 生成位相", descriptionJa: "存在の根源的な発生・出現・潜在性の位相", colorClass: "layer-0" },
  { index: 1, slug: "l1", nameJa: "L1 可能性空間", descriptionJa: "選択肢・分岐・確率・仮説の空間", colorClass: "layer-1" },
  { index: 2, slug: "l2", nameJa: "L2 時間因果", descriptionJa: "原因・結果・時系列・プロセスの連鎖", colorClass: "layer-2" },
  { index: 3, slug: "l3", nameJa: "L3 主体心理", descriptionJa: "主観・感情・動機・意図・認知の層", colorClass: "layer-3" },
  { index: 4, slug: "l4", nameJa: "L4 社会評価", descriptionJa: "規範・価値判断・社会的意味・評判の層", colorClass: "layer-4" },
  { index: 5, slug: "l5", nameJa: "L5 制度形式", descriptionJa: "法・制度・手続き・形式的ルールの層", colorClass: "layer-5" },
];

const DICTIONARY_TERMS = [
  // L0 生成位相
  { layerSlug: "l0", term: "生成", weight: 1.5 }, { layerSlug: "l0", term: "発生", weight: 1.4 },
  { layerSlug: "l0", term: "存在", weight: 1.3 }, { layerSlug: "l0", term: "潜在", weight: 1.4 },
  { layerSlug: "l0", term: "根源", weight: 1.5 }, { layerSlug: "l0", term: "位相", weight: 1.3 },
  { layerSlug: "l0", term: "出現", weight: 1.3 }, { layerSlug: "l0", term: "本質", weight: 1.4 },
  { layerSlug: "l0", term: "起源", weight: 1.4 }, { layerSlug: "l0", term: "創出", weight: 1.5 },
  { layerSlug: "l0", term: "発現", weight: 1.3 }, { layerSlug: "l0", term: "顕現", weight: 1.4 },
  { layerSlug: "l0", term: "潜勢", weight: 1.3 }, { layerSlug: "l0", term: "実体", weight: 1.2 },
  { layerSlug: "l0", term: "本源", weight: 1.4 }, { layerSlug: "l0", term: "発露", weight: 1.3 },
  { layerSlug: "l0", term: "萌芽", weight: 1.4 }, { layerSlug: "l0", term: "胚胎", weight: 1.3 },
  { layerSlug: "l0", term: "源泉", weight: 1.3 }, { layerSlug: "l0", term: "誕生", weight: 1.2 },
  { layerSlug: "l0", term: "創造", weight: 1.4 }, { layerSlug: "l0", term: "発端", weight: 1.2 },
  { layerSlug: "l0", term: "素地", weight: 1.1 }, { layerSlug: "l0", term: "基底", weight: 1.2 },
  { layerSlug: "l0", term: "原初", weight: 1.4 }, { layerSlug: "l0", term: "発生源", weight: 1.3 },
  { layerSlug: "l0", term: "芽生え", weight: 1.2 }, { layerSlug: "l0", term: "原質", weight: 1.3 },
  { layerSlug: "l0", term: "根拠", weight: 1.1 }, { layerSlug: "l0", term: "宇宙", weight: 1.0 },
  { layerSlug: "l0", term: "虚無", weight: 1.2 }, { layerSlug: "l0", term: "創生", weight: 1.4 },
  { layerSlug: "l0", term: "霊性", weight: 1.1 }, { layerSlug: "l0", term: "本性", weight: 1.3 },
  { layerSlug: "l0", term: "始まり", weight: 1.2 }, { layerSlug: "l0", term: "原点", weight: 1.3 },
  { layerSlug: "l0", term: "核心", weight: 1.2 }, { layerSlug: "l0", term: "内在", weight: 1.3 },
  { layerSlug: "l0", term: "超越", weight: 1.2 }, { layerSlug: "l0", term: "原理", weight: 1.2 },
  { layerSlug: "l0", term: "創発", weight: 1.5 }, { layerSlug: "l0", term: "自己組織化", weight: 1.4 },
  { layerSlug: "l0", term: "原型", weight: 1.3 }, { layerSlug: "l0", term: "質料", weight: 1.2 },
  { layerSlug: "l0", term: "生命", weight: 1.2 }, { layerSlug: "l0", term: "意識", weight: 1.2 },
  { layerSlug: "l0", term: "無意識", weight: 1.3 }, { layerSlug: "l0", term: "母体", weight: 1.2 },
  { layerSlug: "l0", term: "種子", weight: 1.3 }, { layerSlug: "l0", term: "根底", weight: 1.3 },
  // L1 可能性空間
  { layerSlug: "l1", term: "可能性", weight: 1.5 }, { layerSlug: "l1", term: "選択", weight: 1.4 },
  { layerSlug: "l1", term: "分岐", weight: 1.5 }, { layerSlug: "l1", term: "仮説", weight: 1.4 },
  { layerSlug: "l1", term: "確率", weight: 1.3 }, { layerSlug: "l1", term: "代替", weight: 1.2 },
  { layerSlug: "l1", term: "選択肢", weight: 1.4 }, { layerSlug: "l1", term: "シナリオ", weight: 1.3 },
  { layerSlug: "l1", term: "蓋然性", weight: 1.4 }, { layerSlug: "l1", term: "潜在性", weight: 1.3 },
  { layerSlug: "l1", term: "多様性", weight: 1.2 }, { layerSlug: "l1", term: "岐路", weight: 1.3 },
  { layerSlug: "l1", term: "転換点", weight: 1.3 }, { layerSlug: "l1", term: "決断", weight: 1.2 },
  { layerSlug: "l1", term: "判断", weight: 1.1 }, { layerSlug: "l1", term: "リスク", weight: 1.2 },
  { layerSlug: "l1", term: "予測", weight: 1.2 }, { layerSlug: "l1", term: "仮定", weight: 1.3 },
  { layerSlug: "l1", term: "前提", weight: 1.2 }, { layerSlug: "l1", term: "未来", weight: 1.1 },
  { layerSlug: "l1", term: "展望", weight: 1.2 }, { layerSlug: "l1", term: "仮想", weight: 1.2 },
  { layerSlug: "l1", term: "想定", weight: 1.2 }, { layerSlug: "l1", term: "代替案", weight: 1.3 },
  { layerSlug: "l1", term: "戦略", weight: 1.2 }, { layerSlug: "l1", term: "戦術", weight: 1.1 },
  { layerSlug: "l1", term: "トレードオフ", weight: 1.3 }, { layerSlug: "l1", term: "ジレンマ", weight: 1.3 },
  { layerSlug: "l1", term: "多分岐", weight: 1.3 }, { layerSlug: "l1", term: "可能世界", weight: 1.4 },
  { layerSlug: "l1", term: "反事実", weight: 1.3 }, { layerSlug: "l1", term: "開放性", weight: 1.2 },
  { layerSlug: "l1", term: "自由度", weight: 1.2 }, { layerSlug: "l1", term: "柔軟性", weight: 1.1 },
  { layerSlug: "l1", term: "適応力", weight: 1.1 }, { layerSlug: "l1", term: "バリエーション", weight: 1.1 },
  { layerSlug: "l1", term: "シミュレーション", weight: 1.2 }, { layerSlug: "l1", term: "偶然", weight: 1.2 },
  { layerSlug: "l1", term: "不確実", weight: 1.2 }, { layerSlug: "l1", term: "余地", weight: 1.0 },
  // L2 時間因果
  { layerSlug: "l2", term: "原因", weight: 1.5 }, { layerSlug: "l2", term: "結果", weight: 1.4 },
  { layerSlug: "l2", term: "因果", weight: 1.5 }, { layerSlug: "l2", term: "過程", weight: 1.3 },
  { layerSlug: "l2", term: "プロセス", weight: 1.3 }, { layerSlug: "l2", term: "連鎖", weight: 1.4 },
  { layerSlug: "l2", term: "展開", weight: 1.2 }, { layerSlug: "l2", term: "変化", weight: 1.2 },
  { layerSlug: "l2", term: "推移", weight: 1.3 }, { layerSlug: "l2", term: "遷移", weight: 1.3 },
  { layerSlug: "l2", term: "歴史", weight: 1.1 }, { layerSlug: "l2", term: "経緯", weight: 1.2 },
  { layerSlug: "l2", term: "発展", weight: 1.2 }, { layerSlug: "l2", term: "進化", weight: 1.3 },
  { layerSlug: "l2", term: "変容", weight: 1.3 }, { layerSlug: "l2", term: "変遷", weight: 1.2 },
  { layerSlug: "l2", term: "影響", weight: 1.2 }, { layerSlug: "l2", term: "波及", weight: 1.3 },
  { layerSlug: "l2", term: "連動", weight: 1.2 }, { layerSlug: "l2", term: "時系列", weight: 1.4 },
  { layerSlug: "l2", term: "トリガー", weight: 1.3 }, { layerSlug: "l2", term: "引き金", weight: 1.3 },
  { layerSlug: "l2", term: "きっかけ", weight: 1.2 }, { layerSlug: "l2", term: "もたらす", weight: 1.2 },
  { layerSlug: "l2", term: "引き起こす", weight: 1.3 }, { layerSlug: "l2", term: "促進", weight: 1.2 },
  { layerSlug: "l2", term: "抑制", weight: 1.2 }, { layerSlug: "l2", term: "加速", weight: 1.2 },
  { layerSlug: "l2", term: "サイクル", weight: 1.2 }, { layerSlug: "l2", term: "フィードバック", weight: 1.3 },
  { layerSlug: "l2", term: "累積", weight: 1.2 }, { layerSlug: "l2", term: "成長", weight: 1.2 },
  { layerSlug: "l2", term: "衰退", weight: 1.2 }, { layerSlug: "l2", term: "崩壊", weight: 1.3 },
  { layerSlug: "l2", term: "再生", weight: 1.2 }, { layerSlug: "l2", term: "転換", weight: 1.2 },
  { layerSlug: "l2", term: "相互作用", weight: 1.3 }, { layerSlug: "l2", term: "相互依存", weight: 1.2 },
  { layerSlug: "l2", term: "段階", weight: 1.1 }, { layerSlug: "l2", term: "文脈", weight: 1.1 },
  // L3 主体心理
  { layerSlug: "l3", term: "感情", weight: 1.5 }, { layerSlug: "l3", term: "感覚", weight: 1.3 },
  { layerSlug: "l3", term: "主観", weight: 1.4 }, { layerSlug: "l3", term: "内面", weight: 1.4 },
  { layerSlug: "l3", term: "心理", weight: 1.4 }, { layerSlug: "l3", term: "動機", weight: 1.3 },
  { layerSlug: "l3", term: "意図", weight: 1.3 }, { layerSlug: "l3", term: "欲求", weight: 1.4 },
  { layerSlug: "l3", term: "欲望", weight: 1.3 }, { layerSlug: "l3", term: "認知", weight: 1.3 },
  { layerSlug: "l3", term: "信念", weight: 1.3 }, { layerSlug: "l3", term: "アイデンティティ", weight: 1.3 },
  { layerSlug: "l3", term: "自己", weight: 1.3 }, { layerSlug: "l3", term: "自我", weight: 1.3 },
  { layerSlug: "l3", term: "喜び", weight: 1.3 }, { layerSlug: "l3", term: "悲しみ", weight: 1.3 },
  { layerSlug: "l3", term: "怒り", weight: 1.3 }, { layerSlug: "l3", term: "恐怖", weight: 1.3 },
  { layerSlug: "l3", term: "不安", weight: 1.3 }, { layerSlug: "l3", term: "希望", weight: 1.2 },
  { layerSlug: "l3", term: "絶望", weight: 1.3 }, { layerSlug: "l3", term: "愛情", weight: 1.3 },
  { layerSlug: "l3", term: "罪悪感", weight: 1.3 }, { layerSlug: "l3", term: "恥", weight: 1.3 },
  { layerSlug: "l3", term: "誇り", weight: 1.2 }, { layerSlug: "l3", term: "承認欲求", weight: 1.3 },
  { layerSlug: "l3", term: "共感", weight: 1.3 }, { layerSlug: "l3", term: "思いやり", weight: 1.2 },
  { layerSlug: "l3", term: "直感", weight: 1.2 }, { layerSlug: "l3", term: "トラウマ", weight: 1.3 },
  { layerSlug: "l3", term: "ストレス", weight: 1.2 }, { layerSlug: "l3", term: "幸福感", weight: 1.2 },
  { layerSlug: "l3", term: "孤独", weight: 1.2 }, { layerSlug: "l3", term: "帰属感", weight: 1.2 },
  { layerSlug: "l3", term: "安心感", weight: 1.2 }, { layerSlug: "l3", term: "使命感", weight: 1.2 },
  { layerSlug: "l3", term: "達成感", weight: 1.2 }, { layerSlug: "l3", term: "渇望", weight: 1.3 },
  { layerSlug: "l3", term: "衝動", weight: 1.3 }, { layerSlug: "l3", term: "内省", weight: 1.3 },
  // L4 社会評価
  { layerSlug: "l4", term: "規範", weight: 1.5 }, { layerSlug: "l4", term: "評価", weight: 1.3 },
  { layerSlug: "l4", term: "批判", weight: 1.3 }, { layerSlug: "l4", term: "称賛", weight: 1.2 },
  { layerSlug: "l4", term: "道徳", weight: 1.4 }, { layerSlug: "l4", term: "倫理", weight: 1.4 },
  { layerSlug: "l4", term: "正義", weight: 1.3 }, { layerSlug: "l4", term: "公正", weight: 1.3 },
  { layerSlug: "l4", term: "差別", weight: 1.3 }, { layerSlug: "l4", term: "平等", weight: 1.2 },
  { layerSlug: "l4", term: "不平等", weight: 1.3 }, { layerSlug: "l4", term: "名声", weight: 1.2 },
  { layerSlug: "l4", term: "評判", weight: 1.2 }, { layerSlug: "l4", term: "誠実", weight: 1.2 },
  { layerSlug: "l4", term: "共同体", weight: 1.2 }, { layerSlug: "l4", term: "文化", weight: 1.1 },
  { layerSlug: "l4", term: "慣習", weight: 1.2 }, { layerSlug: "l4", term: "タブー", weight: 1.3 },
  { layerSlug: "l4", term: "スティグマ", weight: 1.3 }, { layerSlug: "l4", term: "偏見", weight: 1.2 },
  { layerSlug: "l4", term: "社会規範", weight: 1.4 }, { layerSlug: "l4", term: "社会的圧力", weight: 1.3 },
  { layerSlug: "l4", term: "排除", weight: 1.3 }, { layerSlug: "l4", term: "包摂", weight: 1.2 },
  { layerSlug: "l4", term: "正当性", weight: 1.3 }, { layerSlug: "l4", term: "権威", weight: 1.2 },
  { layerSlug: "l4", term: "格差", weight: 1.2 }, { layerSlug: "l4", term: "世論", weight: 1.2 },
  { layerSlug: "l4", term: "透明性", weight: 1.2 }, { layerSlug: "l4", term: "言説", weight: 1.2 },
  { layerSlug: "l4", term: "ナラティブ", weight: 1.2 }, { layerSlug: "l4", term: "承認", weight: 1.1 },
  { layerSlug: "l4", term: "尊重", weight: 1.2 }, { layerSlug: "l4", term: "軽蔑", weight: 1.2 },
  { layerSlug: "l4", term: "プロパガンダ", weight: 1.3 }, { layerSlug: "l4", term: "受容", weight: 1.1 },
  // L5 制度形式
  { layerSlug: "l5", term: "制度", weight: 1.5 }, { layerSlug: "l5", term: "法律", weight: 1.5 },
  { layerSlug: "l5", term: "規則", weight: 1.4 }, { layerSlug: "l5", term: "規制", weight: 1.4 },
  { layerSlug: "l5", term: "条文", weight: 1.4 }, { layerSlug: "l5", term: "条約", weight: 1.4 },
  { layerSlug: "l5", term: "憲法", weight: 1.5 }, { layerSlug: "l5", term: "法令", weight: 1.4 },
  { layerSlug: "l5", term: "規約", weight: 1.3 }, { layerSlug: "l5", term: "契約", weight: 1.4 },
  { layerSlug: "l5", term: "協定", weight: 1.3 }, { layerSlug: "l5", term: "手続き", weight: 1.3 },
  { layerSlug: "l5", term: "公文書", weight: 1.3 }, { layerSlug: "l5", term: "署名", weight: 1.2 },
  { layerSlug: "l5", term: "認証", weight: 1.2 }, { layerSlug: "l5", term: "申請", weight: 1.2 },
  { layerSlug: "l5", term: "審査", weight: 1.3 }, { layerSlug: "l5", term: "監査", weight: 1.3 },
  { layerSlug: "l5", term: "コンプライアンス", weight: 1.4 }, { layerSlug: "l5", term: "ガバナンス", weight: 1.3 },
  { layerSlug: "l5", term: "行政", weight: 1.3 }, { layerSlug: "l5", term: "政策", weight: 1.3 },
  { layerSlug: "l5", term: "立法", weight: 1.4 }, { layerSlug: "l5", term: "司法", weight: 1.4 },
  { layerSlug: "l5", term: "コンプライアンス", weight: 1.4 }, { layerSlug: "l5", term: "権限", weight: 1.2 },
  { layerSlug: "l5", term: "管轄", weight: 1.2 }, { layerSlug: "l5", term: "統制", weight: 1.2 },
  { layerSlug: "l5", term: "許可", weight: 1.2 }, { layerSlug: "l5", term: "免許", weight: 1.2 },
  { layerSlug: "l5", term: "認可", weight: 1.2 }, { layerSlug: "l5", term: "訴訟", weight: 1.3 },
  { layerSlug: "l5", term: "裁判", weight: 1.4 }, { layerSlug: "l5", term: "判決", weight: 1.4 },
  { layerSlug: "l5", term: "罰則", weight: 1.3 }, { layerSlug: "l5", term: "制裁", weight: 1.3 },
  { layerSlug: "l5", term: "国際法", weight: 1.4 }, { layerSlug: "l5", term: "条例", weight: 1.3 },
  { layerSlug: "l5", term: "違法", weight: 1.3, isNegation: true }, { layerSlug: "l5", term: "無効", weight: 1.2, isNegation: true },
  { layerSlug: "l0", term: "消滅", weight: 1.2, isNegation: true }, { layerSlug: "l1", term: "不可能", weight: 1.3, isNegation: true },
  { layerSlug: "l2", term: "停止", weight: 1.2, isNegation: true }, { layerSlug: "l3", term: "無関心", weight: 1.2, isNegation: true },
  { layerSlug: "l4", term: "無価値", weight: 1.2, isNegation: true },
];

const CONCEPTS = [
  { slug: "sekinin", titleJa: "責任", summary: "行為の帰属と義務の概念。行動の結果に対する説明責任と応答可能性。", tags: ["倫理", "社会", "法律"], entries: { l0: "責任とは行為が存在として帰属する根源的な関係性である。", l1: "免責・軽減・全責任という分岐があり、当事者の合意によって帰着が変わる可能性がある。", l2: "行為→結果→帰属→制裁という時間的因果連鎖の中に責任は位置づけられる。", l3: "責任感・罪悪感・義務感という主観的感情を伴う。", l4: "社会的に責任ある行動が称賛され、無責任は批判される。", l5: "法的責任は刑法・民法・行政法で制度化されている。賠償・処罰・回復という形式的手続きが整備されている。" } },
  { slug: "jiyu", titleJa: "自由", summary: "制約からの解放と自律的意思決定の能力。", tags: ["哲学", "政治", "人権"], entries: { l0: "自由とは存在が自らの根拠によって在ることができる根源的状態である。", l1: "自由は複数の選択肢が開かれている状態を意味する。閉鎖系には自由は成立しない。", l2: "抑圧→抵抗→解放という時間的因果連鎖が自由の歴史を形成する。", l3: "束縛されていないという内面的確信、自己決定の感覚が自由の心理的現実を構成する。", l4: "自由は社会的文脈において評価される。他者の自由との調整が求められる規範がある。", l5: "自由は憲法・人権法・国際条約によって制度的に保護される。表現の自由など形式的権利として規定されている。" } },
  { slug: "seigi", titleJa: "正義", summary: "公正・公平・応報に関する規範的概念。", tags: ["哲学", "倫理", "法律"], entries: { l0: "正義とは存在の秩序における正しさの根源的現れである。", l1: "応報的正義・修復的正義・分配的正義など、どの正義観を採るかという根本的分岐が存在する。", l2: "不正→抵抗→正義実現という因果プロセスが社会的変革を生む。", l3: "正義感は深い感情的確信を伴う。不公平への怒りが正義追求の心理的動力となる。", l4: "正義は社会的に構築される評価基準である。文化・時代・共同体によって異なる。", l5: "正義は司法制度・法律・国際法によって形式化される。裁判所・検察が正義実現の制度的装置として機能する。" } },
  { slug: "ai", titleJa: "愛", summary: "深い感情的つながりと他者への配慮。", tags: ["感情", "関係", "哲学"], entries: { l0: "愛とは生命存在の根源的な引力であり、他者への開放性の根本的位相である。", l1: "誰を・どのように・どの程度愛するかという無数の選択肢がある。", l2: "愛は出会い→惹きつけ→深化→変容というプロセスを経る。", l3: "愛する者への献身、喜びと苦しみの交錯が愛の心理的複雑さを形成する。", l4: "愛は社会的規範によって形作られる。どのような愛が認められるかは文化・時代・宗教によって異なる。", l5: "愛は婚姻制度・家族法など多くの法的制度と接続する。" } },
  { slug: "kenryoku", titleJa: "権力", summary: "他者に影響を与え従わせる能力と構造。", tags: ["政治", "社会", "組織"], entries: { l0: "権力とは関係性の中に潜在する非対称性の根源的現れである。", l1: "権力は行使するか否か、誰に対して、どの程度行使するかという選択の空間を持つ。", l2: "権力は獲得→維持→喪失というサイクルを経る。", l3: "権力欲は人間の根源的動機の一つである。支配への欲求が権力関係の心理的基盤を形成する。", l4: "権力の正当性は社会的評価によって決まる。権力の濫用は道徳的批判の対象となる。", l5: "権力は法的権限・制度的地位・憲法秩序として形式化される。三権分立が権力を制度的に規律する。" } },
  { slug: "shinjitsu", titleJa: "真実", summary: "現実に対応する命題の性質と認識論的問題。", tags: ["哲学", "認識論", "科学"], entries: { l0: "真実とは存在と認識の根源的対応関係である。", l1: "対応説・整合説・プラグマティズムなど、何を真実とするかという根本的選択が認識論的分岐を生む。", l2: "真実の探求は仮説→検証→修正というプロセスを経る。", l3: "真実を知りたいという欲求と回避が葛藤する。認知バイアスが真実把握を歪める。", l4: "社会的真実は集合的合意によって構築される。何を真実とするかは権力と無関係ではない。", l5: "法的真実は証拠規則・証明基準によって制度的に確定される。" } },
  { slug: "jikan", titleJa: "時間", summary: "変化の尺度であり存在の様式。過去・現在・未来の構造。", tags: ["哲学", "物理", "存在論"], entries: { l0: "時間とは存在の変化可能性の根源的位相である。", l1: "限られた時間をどこに配分するか、過去・現在・未来のどこに重心を置くかという根本的選択がある。", l2: "時間は因果の媒体である。原因は結果に先行し、時間の矢は一方向に進む。", l3: "時間体験は主観的である。時間の主観的速度・過去への郷愁・未来への不安が心理的現実を形成する。", l4: "時間管理は社会的規範となっている。時間厳守・効率への社会的評価がある。", l5: "時効・締め切り・任期・契約期間など、時間の法的意味が権利義務の発生・消滅を決定する。" } },
  { slug: "shizen", titleJa: "自然", summary: "人為を超えた存在の総体と生態系。", tags: ["環境", "哲学", "科学"], entries: { l0: "自然とは人為的に構成されていない存在の根源的様相である。", l1: "支配するか共生するか、開発するか保護するかという根本的分岐がある。", l2: "自然は生態系という複雑な因果連鎖によって成立する。食物連鎖・物質循環が相互に連動する。", l3: "畏敬・安らぎ・恐怖・美しさへの感動が自然との心理的関係を形成する。", l4: "環境保護・持続可能性・世代間公正が社会的規範として形成されている。", l5: "自然は環境法・自然保護法・国際環境条約によって法的に保護される。" } },
  { slug: "kotoba", titleJa: "言葉", summary: "意味を媒介する記号系。コミュニケーションと思考の道具。", tags: ["言語", "哲学", "コミュニケーション"], entries: { l0: "言葉とは存在が自己表現する根源的媒体である。", l1: "何を言い、何を言わないか、どう表現するかという選択が意味の生成に影響する。", l2: "言葉は発話→伝達→解釈→応答という時間的連鎖を生む。", l3: "言葉は感情を表現し、また感情を生み出す。内面の経験を言語化する行為は自己認識を変容させる。", l4: "言葉は社会的権力と深く結びついている。言語的差別・ヘイトスピーチは批判の対象となる。", l5: "言論の自由は憲法で保護され、名誉毀損・侮辱は法的に規制される。" } },
  { slug: "tomi", titleJa: "富", summary: "経済的豊かさと資源の集積。分配と格差の問題。", tags: ["経済", "社会", "倫理"], entries: { l0: "富とは資源・エネルギー・価値の根源的蓄積状態である。", l1: "投資か消費か、独占か分配かという選択が富の様態を決定する。", l2: "生産→流通→消費→再生産という経済的連鎖の中で富が生成される。", l3: "富への欲求と喪失への恐怖が人間行動を動機づける。", l4: "富の分配は社会的正義の問題である。格差拡大は批判される。", l5: "財産権・相続法・税法・金融規制によって法的に規律される。" } },
  { slug: "sensou", titleJa: "戦争", summary: "集団間の組織的暴力とその構造・原因・帰結。", tags: ["政治", "歴史", "倫理"], entries: { l0: "戦争とは集団的暴力が発現する根源的位相である。", l1: "戦争を始めるか否か、どの手段を用いるか、いつ終わらせるかという選択肢が常に存在する。", l2: "戦争は原因→開戦→戦闘→終戦→和平という時間的連鎖を持つ。", l3: "恐怖・怒り・愛国心・憎悪など強烈な感情を生み出す。", l4: "何が正当な戦争かは倫理的議論の的であり、民間人保護が社会的規範として形成されてきた。", l5: "戦争は国際法・ジュネーブ条約・国連憲章によって規律される。" } },
  { slug: "kyouiku", titleJa: "教育", summary: "知識・技能・価値観の伝達と人間形成のプロセス。", tags: ["社会", "文化", "発達"], entries: { l0: "教育とは人間の可能性を顕現させる根源的プロセスである。", l1: "何を教えるか、どう教えるかという根本的選択がある。", l2: "教育は学習→内化→応用→創造という認知的プロセスを生む。", l3: "学ぶ喜び・知への好奇心・達成感・挫折感が教育の心理的側面を形成する。", l4: "学歴・資格・偏差値が社会的地位と連動し、教育の機会格差が社会問題として批判される。", l5: "教育権は憲法で保障され、学校教育法・教育基本法が制度を規律する。" } },
  { slug: "heiwa", titleJa: "平和", summary: "暴力の不在と積極的な共生状態。", tags: ["政治", "倫理", "社会"], entries: { l0: "平和とは存在が暴力的破壊なしに在り続けられる根源的状態である。", l1: "軍備か軍縮か、対話か強硬姿勢かという選択が平和の可能性を左右する。", l2: "平和は交渉→合意→信頼構築→制度化という時間的プロセスを必要とする。", l3: "暴力への恐怖・安全への欲求・調和への渇望が平和の心理的基盤を形成する。", l4: "平和は最高の社会的価値の一つとして評価される。", l5: "平和は国連憲章・平和条約・安全保障体制によって制度的に支えられる。" } },
  { slug: "gijutsu", titleJa: "技術", summary: "人間の目的を達成するための体系的な手段と知識。", tags: ["科学", "イノベーション", "社会"], entries: { l0: "技術とは人間の能力を延長・増幅する根源的な媒体である。", l1: "どの技術を優先するか、技術と人間のどちらを中心に置くかという根本的分岐がある。", l2: "技術は発明→普及→最適化→陳腐化→次世代技術という時間的連鎖を経る。", l3: "技術への好奇心・革新の喜び・テクノフォビアが心理的側面を形成する。", l4: "イノベーションは称賛され、技術的失業・プライバシー侵害は批判される。", l5: "技術は特許法・著作権法・製造物責任法・AI規制法によって法的に規律される。" } },
  { slug: "byoki", titleJa: "病気", summary: "身体・精神の機能不全と医療・ケアの問題。", tags: ["医療", "身体", "社会"], entries: { l0: "病気とは生命の秩序が根源的に乱れた状態である。", l1: "治療するか緩和するか、西洋医学か代替医療かという選択が問われる。", l2: "病気は原因→症状→診断→治療→回復という時間的プロセスを経る。", l3: "恐怖・否認・怒り・悲しみ・受容という感情的プロセスを伴う。", l4: "病気は社会的スティグマと結びつくことがある。精神疾患への偏見が社会的排除を生む場合がある。", l5: "医療は医師法・薬事法・医療保険制度によって規律される。" } },
  { slug: "kazoku", titleJa: "家族", summary: "血縁・婚姻・養育関係で結ばれた最小社会単位。", tags: ["社会", "関係", "文化"], entries: { l0: "家族とは生命の連続性と親密性が根源的に発現する場である。", l1: "核家族・拡大家族・シングル親など、家族の定義自体が可変的な選択肢の空間にある。", l2: "家族は出会い→結婚→子育て→老い→別れというライフサイクルの連鎖を持つ。", l3: "愛・安心・依存・葛藤が凝縮した感情的場である。", l4: "「正常な家族」の定義は文化・時代によって変化する。", l5: "家族は民法・家族法・相続法・育児介護法によって法的に規律される。" } },
  { slug: "shigoto", titleJa: "仕事", summary: "価値を生み出す活動と労働の意味・構造。", tags: ["経済", "社会", "心理"], entries: { l0: "仕事とは人間が自己の能力を世界に発現させる根源的な活動である。", l1: "どの仕事を選ぶか、起業か就職か、専門化か汎用化かという分岐が職業人生を形作る。", l2: "仕事は準備→実行→評価→改善という反復的プロセスを持つ。", l3: "仕事への意欲・やりがい・燃え尽き・達成感が心理的側面を形成する。", l4: "職業威信・社会貢献度への評価が仕事の社会的位置づけを決定する。", l5: "労働は労働基準法・雇用契約・社会保険制度によって法的に規律される。" } },
  { slug: "kioku", titleJa: "記憶", summary: "過去の経験を保持し現在に影響させる認知機能。", tags: ["心理", "認知", "哲学"], entries: { l0: "記憶とは過去の経験が現在において潜在的に存在し続ける根源的様式である。", l1: "想起・抑圧・改竄・美化という記憶操作の選択肢が記憶の多様な様態を生み出す。", l2: "記憶は符号化→保持→想起という時間的プロセスを経る。", l3: "感情的記憶の強さ、郷愁・後悔・トラウマが記憶の心理的複雑さを形成する。", l4: "集合的記憶は社会的アイデンティティと規範を形成する。", l5: "個人情報保護・忘れられる権利が法的に規律される。" } },
  { slug: "shindou", titleJa: "信頼", summary: "他者の行為への期待と脆弱性の受け入れ。", tags: ["社会", "心理", "倫理"], entries: { l0: "信頼とは他者に対して自己の脆弱性を開く根源的な存在様式である。", l1: "信頼するかしないか、誰を信頼するか、どの程度信頼するかという選択が関係を形成する。", l2: "信頼は小さな約束の履行→信用の蓄積→深い信頼という時間的プロセスを経て築かれる。", l3: "信頼は安心感・開放性・脆弱性の受け入れを伴う感情状態である。", l4: "信頼は社会的資本として機能する。高信頼社会では協力が促進される。", l5: "信頼は契約・保証・資格制度・認証機関によって制度的に補完される。" } },
  { slug: "doki", titleJa: "動機", summary: "行動を引き起こす内的要因と心理的駆動力。", tags: ["心理", "行動", "哲学"], entries: { l0: "動機は行動を発生させる根源的エネルギーの位相にある。", l1: "複数の動機が競合し、外発的動機か内発的動機かという選択が行動の質を決定する。", l2: "欲求発生→動機形成→行動→目標達成という因果連鎖がある。", l3: "動機は本質的に主観的・心理的である。欲求・感情・価値観が動機の基盤を形成する。", l4: "純粋な動機は称賛され、不純な動機（私利私欲）は批判される。", l5: "法的文脈では犯罪の動機が量刑に影響する。故意・過失が法的判断の要素となる。" } },
  { slug: "kachi", titleJa: "価値", summary: "重要性・有用性・意義の概念と評価の基準。", tags: ["哲学", "経済", "倫理"], entries: { l0: "価値とは存在の重要性・意義が顕在化する根源的位相である。", l1: "何に価値を見出すか、使用価値・交換価値・感情的価値の優先順位が問われる。", l2: "生産→流通→消費という価値の時間的連鎖がある。", l3: "価値を感じる・感じないという主観的体験。内在的価値と外在的価値の違いが核心をなす。", l4: "社会的に高い価値を持つとされるものが評価される。価値観の衝突が社会的緊張を生む。", l5: "価格制度・知的財産権・文化財指定など価値を制度的に確定・保護するシステムが存在する。" } },
  { slug: "souzousei", titleJa: "創造性", summary: "新しいものを生み出す能力と創造のプロセス。", tags: ["アート", "イノベーション", "心理"], entries: { l0: "創造性とは存在しなかったものを世界に出現させる根源的能力である。", l1: "無数の可能性の中から特定の組み合わせを選ぶ能力が創造的選択の本質である。", l2: "創造は準備→インキュベーション→洞察→検証という段階的プロセスを経る。", l3: "創造への衝動・フロー体験・完成の喜び・批判への不安が心理的側面を形成する。", l4: "独自性・革新性・美的価値が創造物の社会的評価基準となる。", l5: "著作権・特許権・商標権が創造物の法的保護を提供する。" } },
  { slug: "byodou", titleJa: "平等", summary: "人々が等しく扱われるべきという規範的主張。", tags: ["社会", "政治", "倫理"], entries: { l0: "平等とは存在としての人間の根源的同一性に基づく価値概念である。", l1: "形式的平等か実質的平等か、機会の平等か結果の平等かという根本的選択がある。", l2: "不平等→抵抗→変革→新たな平等の実現という歴史的因果連鎖がある。", l3: "不平等への怒り、差別された経験への傷つき、平等実現への希望が心理的側面を形成する。", l4: "平等は現代社会の中心的価値の一つである。差別・格差・特権への批判が定着している。", l5: "平等権は憲法・人権法・差別禁止法によって保障される。" } },
  { slug: "songen", titleJa: "尊厳", summary: "人間の固有の価値と尊重されるべき地位。", tags: ["倫理", "人権", "哲学"], entries: { l0: "尊厳とは人間存在の根源的な内在的価値であり、いかなる条件にも依存しない固有の重要性の位相である。", l1: "尊厳を守るかどうかという選択が個人・組織・社会に常に問われる。", l2: "尊厳の侵害→認識→抵抗→回復というプロセスが個人と社会のレベルで展開する。", l3: "尊厳は自己価値感・誇り・恥辱感と深く結びついている。", l4: "人間の尊厳の尊重は現代倫理の中心原理である。", l5: "尊厳は憲法・人権条約・生命倫理指針によって法的に保護される。" } },
  { slug: "risuku", titleJa: "リスク", summary: "不確実性と潜在的損失の評価と管理。", tags: ["経済", "意思決定", "心理"], entries: { l0: "リスクとは存在の脆弱性と変化可能性から根源的に生まれる不確実性の位相である。", l1: "回避・転嫁・保有・低減という選択肢がリスクマネジメントの基本分岐を形成する。", l2: "リスクは顕在化→損失発生→対応→回復という時間的連鎖を経る。", l3: "損失回避バイアス・ゼロリスク幻想・楽観バイアスが合理的リスク評価を歪める。", l4: "起業のリスクは称賛され、無謀なリスクは批判される。リスク情報の開示が社会的規範として求められる。", l5: "リスクは金融規制・保険法・安全規制によって制度的に管理される。" } },
  { slug: "minshushugi", titleJa: "民主主義", summary: "市民の意思による政治的支配の原理と制度。", tags: ["政治", "社会", "制度"], entries: { l0: "民主主義とは人民の意思が政治権力の根源的正当性となる存在論的原理である。", l1: "直接民主制か代議制か、多数決か熟議かという根本的分岐がある。", l2: "選挙→代表選出→立法→行政→選挙という民主的サイクルが繰り返される。", l3: "市民参加の満足感、無力感、代表への信頼と不信が民主主義の心理的側面を形成する。", l4: "民主主義は現代の正当な統治原理として高く評価される。独裁・専制は批判される。", l5: "民主主義は憲法・選挙法・政党法・情報公開法によって制度的に具体化される。" } },
  { slug: "kojin", titleJa: "個人", summary: "社会から区別された単独の人格的存在。", tags: ["哲学", "社会", "心理"], entries: { l0: "個人とは分割不可能な単位として存在する人格の根源的位相である。", l1: "個人か集団か、自律か依存かという選択が個人の生き方を形成する。", l2: "個人は誕生→発達→成熟→老化→死という時間的存在である。", l3: "自己同一性・個性・アイデンティティが個人の心理的中核を形成する。", l4: "個人主義の評価は文化によって異なる。集団主義社会では個人よりも集団が重視される。", l5: "個人の権利は憲法・人権法・プライバシー法によって法的に保護される。" } },
  { slug: "gengo", titleJa: "言語", summary: "コミュニケーションの体系的な記号システム。", tags: ["言語学", "認知", "文化"], entries: { l0: "言語とは人間の認知と表現の根源的な構造化システムである。", l1: "どの言語で表現するか、どのジャンルや文体を選ぶかという選択がある。", l2: "言語は習得→運用→変化→消滅という時間的プロセスを経る。", l3: "言語と思考の関係において、言語が認知を形成するという言語相対性の問題がある。", l4: "標準語・方言・外来語への社会的評価が言語の価値序列を生む。", l5: "公用語・言語政策・著作権法・表現規制が言語の法的・制度的枠組みを形成する。" } },
  { slug: "shihonshugi", titleJa: "資本主義", summary: "資本の蓄積と市場による資源配分の経済システム。", tags: ["経済", "政治", "社会"], entries: { l0: "資本主義とは私的所有と利潤追求が経済活動の根源的動力となる存在様式である。", l1: "自由放任か規制か、福祉国家か新自由主義かという根本的選択がある。", l2: "資本の蓄積→投資→生産→利潤→再投資という経済的連鎖が資本主義を駆動する。", l3: "競争への意欲、豊かさへの欲求、格差への不満が資本主義の心理的側面を形成する。", l4: "資本主義は効率と創新を称賛するが、格差・搾取・環境破壊は批判の対象となる。", l5: "会社法・競争法・金融規制・労働法が資本主義を制度的に規律する。" } },
  { slug: "kankyou", titleJa: "環境", summary: "生物を取り巻く自然的・社会的条件の総体。", tags: ["環境", "社会", "科学"], entries: { l0: "環境とは存在を包む外的条件の根源的な場である。", l1: "環境への適応か環境の変革かという選択が存在の戦略を規定する。", l2: "環境変化→生物の適応→新たな均衡という時間的連鎖が生態系を形成する。", l3: "環境への親しみ・破壊への怒り・保全への義務感が心理的側面を形成する。", l4: "環境保護は現代の重要な社会規範となっている。環境破壊は強く批判される。", l5: "環境基本法・廃棄物処理法・気候変動対策法が環境を制度的に保護する。" } },
  { slug: "identity", titleJa: "アイデンティティ", summary: "自己の継続的同一性と帰属の感覚。", tags: ["心理", "哲学", "社会"], entries: { l0: "アイデンティティとは存在の自己同一性という根源的な問いに関わる位相である。", l1: "何者であるかという問いに対する複数の答えの可能性がある。個人的・集団的アイデンティティの選択がある。", l2: "アイデンティティは発達・危機・再構成というプロセスを経て変容する。", l3: "帰属感・継続性の感覚・独自性の感覚がアイデンティティの心理的中核を形成する。", l4: "アイデンティティは社会的承認と相互認識によって確立される。", l5: "国籍・市民権・戸籍・パスポートがアイデンティティを法的に確定する。" } },
  { slug: "innovation", titleJa: "イノベーション", summary: "新しい価値を生み出す革新的変化のプロセス。", tags: ["経済", "技術", "社会"], entries: { l0: "イノベーションとは既存の秩序を破壊し新たな可能性の位相を開く根源的創造活動である。", l1: "どこにイノベーションの機会があるか、どのアプローチを採るかという選択がある。", l2: "アイデア→試作→検証→普及→標準化という時間的連鎖がイノベーションを形成する。", l3: "創造への興奮・失敗への恐怖・変化への抵抗がイノベーションの心理的側面を形成する。", l4: "イノベーションは経済成長の源として高く評価される社会規範がある。", l5: "特許法・スタートアップ支援法・規制サンドボックスがイノベーションを制度的に支援する。" } },
  { slug: "communication", titleJa: "コミュニケーション", summary: "意味と情報の相互的交換プロセス。", tags: ["言語", "社会", "心理"], entries: { l0: "コミュニケーションとは存在と存在の間に意味が発生する根源的な間主観的位相である。", l1: "何を伝えるか、どう伝えるか、誰に伝えるかという選択がある。", l2: "発信→伝達→受信→解釈→応答という時間的連鎖がコミュニケーションを形成する。", l3: "共感・誤解・孤独感・つながりの感覚がコミュニケーションの心理的側面を形成する。", l4: "適切なコミュニケーションは社会的規範として期待される。ハラスメント・差別発言は批判される。", l5: "通信法・プライバシー法・表現規制がコミュニケーションを法的に規律する。" } },
  { slug: "bunka", titleJa: "文化", summary: "集団が共有する意味・価値・実践の体系。", tags: ["社会", "人類学", "哲学"], entries: { l0: "文化とは人間集団が生み出す意味の根源的体系である。", l1: "どの文化的実践を選ぶか、文化変容か保存かという選択がある。", l2: "文化は生成→伝承→変容→消滅というプロセスを経る。", l3: "文化的帰属感・誇り・疎外感がアイデンティティと深く結びつく。", l4: "文化の優劣をめぐる評価は常に政治的文脈と結びついている。", l5: "文化財保護法・著作権法・文化政策が文化を制度的に保護・支援する。" } },
  { slug: "shakai", titleJa: "社会", summary: "人々が結びついて形成する集合的構造と関係の総体。", tags: ["社会学", "政治", "哲学"], entries: { l0: "社会とは個人を超えた集合的存在の根源的様式であり、関係性の網目として存在する。", l1: "社会への参加・変革・離脱という選択肢がある。", l2: "社会は形成→分化→統合→変革という歴史的プロセスを経る。", l3: "帰属感・連帯感・疎外感・排除感が社会的存在としての心理的側面を形成する。", l4: "何が社会的に正常か異常かという規範判断が常に機能している。", l5: "法律・制度・官僚制度が社会を形式的に規律する。" } },
  { slug: "keizai", titleJa: "経済", summary: "財・サービスの生産・分配・消費の社会的仕組み。", tags: ["経済", "社会", "政治"], entries: { l0: "経済とは人間の物質的必要と欲望が充足・不充足の位相において現れる根源的な領域である。", l1: "市場か計画か、成長か定常か、効率か公正かという根本的選択がある。", l2: "生産→分配→消費→蓄積という経済循環が時間的連鎖として展開する。", l3: "豊かさへの欲求・貧困への恐怖・経済的不安が心理的側面を形成する。", l4: "経済成長は社会的目標として評価されてきたが、その限界への批判も高まっている。", l5: "経済法・税法・金融規制・貿易協定が経済を制度的に規律する。" } },
  { slug: "seiji", titleJa: "政治", summary: "権力の獲得・行使・配分をめぐる集団的意思決定。", tags: ["政治", "社会", "哲学"], entries: { l0: "政治とは共同体における権力と権威の根源的な編成の問題である。", l1: "参加するか棄権するか、どの政治勢力を支持するかという選択がある。", l2: "選挙→政権獲得→政策実施→評価→次の選挙という政治的連鎖がある。", l3: "政治的信念・イデオロギー・政治的感情が政治参加の心理的基盤を形成する。", l4: "何が正当な政治的主張かという規範的評価が常に機能している。", l5: "憲法・選挙法・政治資金規正法が政治を制度的に規律する。" } },
  { slug: "kenri", titleJa: "権利", summary: "人や集団が要求できる正当な利益・自由・主張。", tags: ["法律", "倫理", "政治"], entries: { l0: "権利とは存在がその固有の価値において扱われるべきという根源的な主張の位相である。", l1: "どの権利を行使するか、権利と権利の衝突においてどちらを優先するかという選択がある。", l2: "権利意識の成長→主張→実現・侵害→救済という時間的プロセスがある。", l3: "権利侵害への怒り・権利実現への希望・権利主張への恐れが心理的側面を形成する。", l4: "基本的人権は普遍的価値として評価される。権利の濫用は批判される。", l5: "憲法・法律・国際条約が権利を法的に確定・保護する。" } },
  { slug: "hanzai", titleJa: "犯罪", summary: "法的に禁止された行為とその社会的・心理的側面。", tags: ["法律", "社会", "心理"], entries: { l0: "犯罪とは社会秩序の根源的な破壊として現れる行為の位相である。", l1: "犯罪に及ぶか否かという決断の分岐点がある。機会・動機・抑止力のバランスが選択を規定する。", l2: "動機形成→計画→実行→発覚→逮捕→裁判→処罰という時間的連鎖がある。", l3: "欲求・絶望・怒り・共感の欠如が犯罪の心理的要因を形成する。", l4: "犯罪は社会的に強く非難される。犯罪者のスティグマが社会的排除を生む。", l5: "刑法・刑事訴訟法・少年法・犯罪被害者支援法が犯罪を法的に規律する。" } },
  { slug: "joho", titleJa: "情報", summary: "意味を持つデータの収集・処理・伝達の体系。", tags: ["情報", "技術", "認識論"], entries: { l0: "情報とは無秩序なデータに意味が発生する根源的な変換の位相である。", l1: "どの情報を収集・保存・廃棄するかという選択がある。", l2: "データ生成→収集→処理→分析→意思決定という時間的連鎖がある。", l3: "情報への好奇心・情報過負荷のストレス・情報の真偽への不安が心理的側面を形成する。", l4: "情報の信頼性・透明性・アクセス可能性が社会的規範として評価される。", l5: "情報公開法・個人情報保護法・著作権法が情報を制度的に規律する。" } },
  { slug: "ai-artificial", titleJa: "人工知能", summary: "機械による知的行動の実現と社会的影響。", tags: ["技術", "哲学", "社会"], entries: { l0: "人工知能とは知性という人間固有と思われた能力が機械において発現する根源的な技術的位相である。", l1: "AIをどこに・どこまで・どのように使うかという選択がある。", l2: "アルゴリズム開発→学習→最適化→展開→影響評価という時間的連鎖がある。", l3: "AIへの期待・脅威感・創造性への不安がAI時代の心理的側面を形成する。", l4: "AIの倫理的使用・偏見の排除・透明性確保が社会的規範として形成されつつある。", l5: "EU AI法・著作権法・プライバシー規制がAIを制度的に規律しつつある。" } },
  { slug: "sabetsu", titleJa: "差別", summary: "不当な区別と不平等な扱いの社会的現象。", tags: ["社会", "倫理", "法律"], entries: { l0: "差別とは存在の固有の価値が否定される根源的な不正義の位相である。", l1: "差別に加担するか抵抗するか、傍観者に留まるかという選択が常に問われる。", l2: "偏見の形成→差別的行為→被害→認識→抵抗→変革という時間的連鎖がある。", l3: "被差別経験の傷つき・加害者の罪悪感・傍観者の無力感が心理的側面を形成する。", l4: "差別は現代社会で強く批判される。多様性・包摂が規範として確立されつつある。", l5: "差別禁止法・人権条約・雇用均等法が差別を法的に禁止・救済する。" } },
  { slug: "fukushi", titleJa: "福祉", summary: "社会的弱者への支援と人々の生活の質の向上。", tags: ["社会", "政治", "倫理"], entries: { l0: "福祉とは社会の中で最も脆弱な存在を支える根源的な人間的連帯の位相である。", l1: "普遍的給付か選別的給付か、現金か現物かという選択がある。", l2: "ニーズの発生→申請→審査→給付→自立支援という時間的連鎖がある。", l3: "受益者の尊厳・担い手の使命感・批判者の公正感が心理的側面を形成する。", l4: "弱者支援は道徳的義務として評価されるが、福祉依存への批判もある。", l5: "社会保険法・生活保護法・障害者支援法が福祉を制度的に規律する。" } },
  { slug: "shukyo", titleJa: "宗教", summary: "超越的存在への信仰と実践の体系。", tags: ["哲学", "文化", "社会"], entries: { l0: "宗教とは人間が超越的なものへの根源的開放性として現れる実存的次元である。", l1: "どの宗教を信じるか・信じないかという選択は人生の根本的分岐をなす。", l2: "啓示→信仰の形成→共同体形成→制度化→変容という時間的連鎖がある。", l3: "信仰の確信・宗教的感動・疑念・改宗体験が宗教の心理的側面を形成する。", l4: "宗教的実践は文化的規範と深く結びついている。宗教的偏見・差別は批判される。", l5: "信教の自由は憲法で保護され、宗教法人法が宗教団体を制度的に規律する。" } },
  { slug: "geijutsu", titleJa: "芸術", summary: "美的経験を生み出す創造的表現の活動。", tags: ["文化", "美学", "哲学"], entries: { l0: "芸術とは人間の創造的衝動が美という形で世界に現れる根源的な表現の位相である。", l1: "何を表現するか、どのメディアを使うか、誰のために作るかという選択がある。", l2: "着想→制作→発表→受容→批評という時間的連鎖がある。", l3: "創造の喜び・批判への不安・表現の解放感が芸術家の心理的側面を形成する。", l4: "芸術の価値評価は複雑で、美的基準・歴史的文脈・社会的意味が評価を形成する。", l5: "著作権法・文化財保護法・芸術振興法が芸術を制度的に保護・支援する。" } },
  { slug: "kenkou", titleJa: "健康", summary: "身体・精神・社会的に良好な状態。", tags: ["医療", "社会", "心理"], entries: { l0: "健康とは生命の根源的な均衡状態であり、存在の本来的な開放性の位相である。", l1: "どのような健康行動を選ぶか、治療か予防かという選択がある。", l2: "生活習慣→健康状態→疾病リスク→医療介入→回復という時間的連鎖がある。", l3: "健康への不安・身体への意識・健康管理への動機が心理的側面を形成する。", l4: "健康は個人の責任とも社会的課題とも評価される複雑な社会規範がある。", l5: "医療法・健康保険法・食品安全法が健康を制度的に保護する。" } },
  { slug: "leadership", titleJa: "リーダーシップ", summary: "集団を方向づけ影響を与える能力と役割。", tags: ["組織", "心理", "社会"], entries: { l0: "リーダーシップとは集団の可能性を顕現させる根源的な触媒的能力である。", l1: "トップダウンかボトムアップか、専制的か民主的かという根本的選択がある。", l2: "ビジョン提示→チーム形成→実行→評価→成長という時間的連鎖がある。", l3: "使命感・権力欲・奉仕の精神がリーダーの心理的動機を形成する。", l4: "優れたリーダーは社会的に称賛される。権威主義的リーダーは批判される。", l5: "コーポレートガバナンス・役員法・労働法がリーダーシップを制度的に規律する。" } },
  { slug: "gakumon", titleJa: "学問", summary: "体系的な知識の探求と蓄積のプロセス。", tags: ["科学", "哲学", "教育"], entries: { l0: "学問とは世界の真実を根源的に探求しようとする知的衝動に基づく活動である。", l1: "どの問いを立てるか、どの方法論を採るかという根本的選択がある。", l2: "問いの設定→仮説→検証→反証・確認→新たな問いという時間的連鎖がある。", l3: "知への好奇心・発見の喜び・誤りへの恥辱が学問の心理的側面を形成する。", l4: "学問の自由・客観性・再現性が社会的規範として評価される。疑似科学は批判される。", l5: "大学設置法・学術振興法・研究倫理指針が学問を制度的に規律する。" } },
];

async function main() {
  console.log("Starting seed...");

  // Upsert layers
  const layerMap = {};
  for (const layer of LAYERS) {
    const record = await prisma.layerDefinition.upsert({
      where: { slug: layer.slug },
      update: { nameJa: layer.nameJa, descriptionJa: layer.descriptionJa, colorClass: layer.colorClass },
      create: layer,
    });
    layerMap[layer.slug] = record.id;
    console.log(`Layer: ${layer.nameJa}`);
  }

  // Upsert dictionary terms
  let dictCount = 0;
  for (const term of DICTIONARY_TERMS) {
    if (!layerMap[term.layerSlug]) continue;
    const existing = await prisma.dictionaryTerm.findFirst({
      where: { layerId: layerMap[term.layerSlug], term: term.term },
    });
    if (!existing) {
      await prisma.dictionaryTerm.create({
        data: { layerId: layerMap[term.layerSlug], term: term.term, weight: term.weight, isNegation: term.isNegation ?? false },
      });
      dictCount++;
    }
  }
  console.log(`Dictionary terms created: ${dictCount}`);

  // Mapping rules
  const existingRules = await prisma.mappingRule.count();
  if (existingRules === 0) {
    await prisma.mappingRule.createMany({
      data: [
        { fromLayerId: layerMap["l3"], toLayerId: layerMap["l4"], pattern: "感情", replacement: "社会的表現", condition: "score_l3 > 0.5", priority: 10 },
        { fromLayerId: layerMap["l4"], toLayerId: layerMap["l5"], pattern: "規範", replacement: "法的規定", condition: "score_l4 > 0.4", priority: 8 },
        { fromLayerId: layerMap["l0"], toLayerId: layerMap["l2"], pattern: "生成", replacement: "プロセス展開", priority: 5 },
        { fromLayerId: layerMap["l1"], toLayerId: layerMap["l3"], pattern: "選択", replacement: "意図的選好", priority: 6 },
        { fromLayerId: layerMap["l2"], toLayerId: layerMap["l4"], pattern: "因果", replacement: "社会的帰責", condition: "score_l2 > 0.4", priority: 7 },
        { fromLayerId: layerMap["l3"], toLayerId: layerMap["l5"], pattern: "欲求", replacement: "権利主張", condition: "score_l3 > 0.6", priority: 9 },
      ],
    });
    console.log("Mapping rules created");
  }

  // Upsert concepts
  let conceptCount = 0;
  for (const concept of CONCEPTS) {
    const { entries, ...conceptData } = concept;
    const created = await prisma.concept.upsert({
      where: { slug: conceptData.slug },
      update: { titleJa: conceptData.titleJa, summary: conceptData.summary, tags: conceptData.tags, isPublished: true },
      create: { ...conceptData, isPublished: true },
    });
    conceptCount++;

    for (const [layerSlug, content] of Object.entries(entries)) {
      if (!layerMap[layerSlug]) continue;
      await prisma.layerEntry.upsert({
        where: { conceptId_layerId: { conceptId: created.id, layerId: layerMap[layerSlug] } },
        update: { content },
        create: { conceptId: created.id, layerId: layerMap[layerSlug], content },
      });
    }
    process.stdout.write(`\rConcepts: ${conceptCount}/${CONCEPTS.length}`);
  }
  console.log(`\nConcepts created: ${conceptCount}`);
  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
