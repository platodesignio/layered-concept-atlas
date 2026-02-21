export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";

const layers = [
  { index: 0, slug: "l0", nameJa: "L0 生成位相", descriptionJa: "存在の根源的な発生・出現・潜在性の位相", colorClass: "layer-0" },
  { index: 1, slug: "l1", nameJa: "L1 可能性空間", descriptionJa: "選択肢・分岐・確率・仮説の空間", colorClass: "layer-1" },
  { index: 2, slug: "l2", nameJa: "L2 時間因果", descriptionJa: "原因・結果・時系列・プロセスの連鎖", colorClass: "layer-2" },
  { index: 3, slug: "l3", nameJa: "L3 主体心理", descriptionJa: "主観・感情・動機・意図・認知の層", colorClass: "layer-3" },
  { index: 4, slug: "l4", nameJa: "L4 社会評価", descriptionJa: "規範・価値判断・社会的意味・評判の層", colorClass: "layer-4" },
  { index: 5, slug: "l5", nameJa: "L5 制度形式", descriptionJa: "法・制度・手続き・形式的ルールの層", colorClass: "layer-5" },
];

const dictionaryTerms = [
  { layerSlug: "l0", term: "発生", weight: 1.2 },
  { layerSlug: "l0", term: "生成", weight: 1.5 },
  { layerSlug: "l0", term: "存在", weight: 1.0 },
  { layerSlug: "l0", term: "潜在", weight: 1.3 },
  { layerSlug: "l0", term: "根源", weight: 1.4 },
  { layerSlug: "l0", term: "位相", weight: 1.2 },
  { layerSlug: "l0", term: "出現", weight: 1.1 },
  { layerSlug: "l0", term: "本質", weight: 1.0 },
  { layerSlug: "l1", term: "可能性", weight: 1.5 },
  { layerSlug: "l1", term: "選択", weight: 1.2 },
  { layerSlug: "l1", term: "分岐", weight: 1.4 },
  { layerSlug: "l1", term: "仮説", weight: 1.3 },
  { layerSlug: "l1", term: "確率", weight: 1.2 },
  { layerSlug: "l1", term: "オプション", weight: 1.1 },
  { layerSlug: "l1", term: "代替", weight: 1.0 },
  { layerSlug: "l2", term: "原因", weight: 1.5 },
  { layerSlug: "l2", term: "結果", weight: 1.4 },
  { layerSlug: "l2", term: "プロセス", weight: 1.2 },
  { layerSlug: "l2", term: "時系列", weight: 1.3 },
  { layerSlug: "l2", term: "因果", weight: 1.5 },
  { layerSlug: "l2", term: "連鎖", weight: 1.1 },
  { layerSlug: "l2", term: "展開", weight: 1.0 },
  { layerSlug: "l3", term: "感情", weight: 1.5 },
  { layerSlug: "l3", term: "動機", weight: 1.4 },
  { layerSlug: "l3", term: "意図", weight: 1.3 },
  { layerSlug: "l3", term: "主観", weight: 1.4 },
  { layerSlug: "l3", term: "認知", weight: 1.2 },
  { layerSlug: "l3", term: "欲求", weight: 1.3 },
  { layerSlug: "l3", term: "心理", weight: 1.5 },
  { layerSlug: "l4", term: "評価", weight: 1.5 },
  { layerSlug: "l4", term: "規範", weight: 1.4 },
  { layerSlug: "l4", term: "批判", weight: 1.2 },
  { layerSlug: "l4", term: "称賛", weight: 1.2 },
  { layerSlug: "l4", term: "社会的", weight: 1.3 },
  { layerSlug: "l4", term: "価値判断", weight: 1.5 },
  { layerSlug: "l4", term: "評判", weight: 1.1 },
  { layerSlug: "l5", term: "制度", weight: 1.5 },
  { layerSlug: "l5", term: "法律", weight: 1.5 },
  { layerSlug: "l5", term: "手続き", weight: 1.3 },
  { layerSlug: "l5", term: "規定", weight: 1.3 },
  { layerSlug: "l5", term: "形式", weight: 1.2 },
  { layerSlug: "l5", term: "条文", weight: 1.4 },
  { layerSlug: "l5", term: "制裁", weight: 1.2 },
];

const concepts = [
  {
    slug: "sekinin", titleJa: "責任", summary: "行為の帰属と義務の概念", tags: ["倫理", "社会"],
    entries: {
      l0: "責任とは行為が存在として帰属する根源的な関係性である。行為の発生と主体の結びつきが責任の発生位相を形成する。",
      l1: "責任を問うかどうか、誰に問うか、どの程度問うかという複数の選択肢が存在する。免責・軽減・全責任という分岐がある。",
      l2: "行為→結果→帰属→制裁という時間的因果連鎖の中に責任は位置づけられる。原因行為が先行し、結果が後続する。",
      l3: "責任感・罪悪感・義務感という主観的感情を伴う。責任を感じるかどうかは主体の認知と感情に依存する。",
      l4: "社会的に責任ある行動が称賛され、無責任は批判される。道徳的・法的責任への社会評価が存在する。",
      l5: "法的責任は刑法・民法で制度化されている。賠償・処罰という形式的手続きが制度として整備されている。",
    },
  },
  {
    slug: "doki", titleJa: "動機", summary: "行動を引き起こす内的要因", tags: ["心理", "行動"],
    entries: {
      l0: "動機は行動を発生させる根源的エネルギーの位相にある。欲求・衝動・意志が動機の生成位相を形成する。",
      l1: "どの動機に従って行動するかという選択が生じる。複数の動機が競合し、優先順位の分岐が発生する。",
      l2: "欲求発生→動機形成→行動→目標達成という因果連鎖。動機が原因となり、行動と結果が後続する。",
      l3: "動機は本質的に主観的・心理的である。欲求・感情・価値観が動機の心理的基盤を形成する。",
      l4: "純粋な動機は称賛され、不純な動機（私利私欲）は批判される。動機の社会的評価が存在する。",
      l5: "法的文脈では犯罪の動機が量刑に影響する。制度的に動機の認定手続きが存在する。",
    },
  },
  {
    slug: "mokuhyo", titleJa: "目標", summary: "達成を目指す具体的な状態", tags: ["計画", "行動"],
    entries: {
      l0: "目標とは未来の理想状態が現在において潜在的に存在する位相である。目標設定が存在の方向性を生む。",
      l1: "どの目標を選ぶか、複数の目標の中から優先順位をつける選択が必要となる。達成・断念という分岐がある。",
      l2: "目標設定→計画→実行→達成・未達という時間的プロセスが展開する。各ステップが因果的に連鎖する。",
      l3: "目標への執着・達成感・挫折感という感情が伴う。目標は主体の意図と認知によって形成される。",
      l4: "高い目標設定は社会的に称賛される。目標達成者は評価され、未達成者への評価は文脈による。",
      l5: "KPI・OKR・契約目標など制度的な目標設定フレームワークが存在する。法的拘束力を持つ目標もある。",
    },
  },
  {
    slug: "kachi-make", titleJa: "勝ち負け", summary: "競争における優劣の判定", tags: ["競争", "評価"],
    entries: {
      l0: "勝ち負けは差異の発生・優劣の生成という根源的位相にある。競争の場が成立した瞬間に勝敗の可能性が生まれる。",
      l1: "勝つための戦略・戦術の選択が存在する。リスク取りか安全策か、複数の選択肢の分岐がある。",
      l2: "競争開始→プロセス→判定→勝敗確定という時間的因果連鎖。先行する行為が後続の結果を規定する。",
      l3: "勝利の喜び・敗北の悔しさという強烈な感情体験。勝ちたいという欲求が主体を動かす心理的動力。",
      l4: "勝者は称賛・尊敬され、敗者は同情・軽蔑される。勝ち負けへの社会的評価と意味付けが存在する。",
      l5: "スポーツルール・審判制度・表彰制度など勝敗を制度的に確定する形式的システムが存在する。",
    },
  },
  {
    slug: "kachi", titleJa: "価値", summary: "重要性・有用性・意義の概念", tags: ["哲学", "経済"],
    entries: {
      l0: "価値とは存在の重要性・意義が顕在化する根源的位相である。無意味な存在から意味ある存在への転換。",
      l1: "何に価値を見出すか、複数の価値観の中から選択する。交換するかしないかという価値判断の分岐。",
      l2: "生産→流通→消費という価値の時間的連鎖。使用価値から交換価値への転換プロセスが展開する。",
      l3: "価値を感じる・感じないという主観的体験。美的価値・実用的価値への個人的感受性が異なる。",
      l4: "社会的に高い価値を持つとされるものが評価される。文化的価値判断・市場価値の社会的形成。",
      l5: "価格制度・知的財産権・文化財指定など価値を制度的に確定・保護するシステムが存在する。",
    },
  },
  {
    slug: "doteki-sesei", titleJa: "動的生成", summary: "時間とともに変化し生成するプロセス", tags: ["プロセス", "変化"],
    entries: {
      l0: "動的生成とは存在が絶えず生成・変化・消滅する根源的位相である。静止した存在ではなく流動する過程。",
      l1: "どの方向に生成が進むか、複数の可能性が開かれている。分岐点で異なる生成パスが選ばれる。",
      l2: "初期状態→変化プロセス→新しい状態という時間的展開。各段階が次の段階の原因となる連鎖。",
      l3: "変化に対する期待・不安・興奮という感情。変化を意図するか流れに任せるかという主体的選択。",
      l4: "イノベーションとしての動的生成は高く評価される。変化への適応力が社会的に評価される。",
      l5: "プロセス管理・品質管理・アジャイル手法など動的生成を制度化するフレームワークが存在する。",
    },
  },
  {
    slug: "ningen-mi", titleJa: "人間味", summary: "人間らしい温かさと感情的つながり", tags: ["感情", "関係性"],
    entries: {
      l0: "人間味とは人間存在の本質的な温かさ・共感能力が顕現する根源的位相である。生の感情の発露。",
      l1: "機械的効率か人間味かという選択。どの程度人間味を優先するかという判断の分岐が存在する。",
      l2: "感情の発生→表現→他者への伝達→共感という時間的因果連鎖。人間味ある関係が段階的に構築される。",
      l3: "温かさ・優しさ・共感という感情が中核にある。人間味は本質的に主観的感情体験に根ざしている。",
      l4: "人間味のある行動は社会的に高く評価される。冷淡さ・非人間的態度は批判される社会規範がある。",
      l5: "ハラスメント防止規定・労働基準法など人間味ある扱いを制度的に保護する法律が存在する。",
    },
  },
];

export async function POST() {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  try {
    // Upsert layers
    const layerMap: Record<string, string> = {};
    for (const layer of layers) {
      const record = await prisma.layerDefinition.upsert({
        where: { slug: layer.slug },
        update: { nameJa: layer.nameJa, descriptionJa: layer.descriptionJa, colorClass: layer.colorClass },
        create: layer,
      });
      layerMap[layer.slug] = record.id;
    }

    // Upsert dictionary terms
    for (const term of dictionaryTerms) {
      const existing = await prisma.dictionaryTerm.findFirst({
        where: { layerId: layerMap[term.layerSlug], term: term.term },
      });
      if (!existing) {
        await prisma.dictionaryTerm.create({
          data: { layerId: layerMap[term.layerSlug], term: term.term, weight: term.weight, isNegation: false },
        });
      }
    }

    // Upsert mapping rules
    const existingRules = await prisma.mappingRule.count();
    if (existingRules === 0) {
      await prisma.mappingRule.createMany({
        data: [
          { fromLayerId: layerMap["l3"], toLayerId: layerMap["l4"], pattern: "感情", replacement: "社会的表現", condition: "score_l3 > 0.5", priority: 10 },
          { fromLayerId: layerMap["l4"], toLayerId: layerMap["l5"], pattern: "規範", replacement: "法的規定", condition: "score_l4 > 0.4", priority: 8 },
          { fromLayerId: layerMap["l0"], toLayerId: layerMap["l2"], pattern: "生成", replacement: "プロセス展開", priority: 5 },
          { fromLayerId: layerMap["l1"], toLayerId: layerMap["l3"], pattern: "選択", replacement: "意図的選好", priority: 6 },
        ],
      });
    }

    // Upsert concepts
    for (const concept of concepts) {
      const { entries, ...conceptData } = concept;
      const created = await prisma.concept.upsert({
        where: { slug: conceptData.slug },
        update: { titleJa: conceptData.titleJa, summary: conceptData.summary, isPublished: true },
        create: { ...conceptData, isPublished: true },
      });
      for (const [layerSlug, content] of Object.entries(entries)) {
        await prisma.layerEntry.upsert({
          where: { conceptId_layerId: { conceptId: created.id, layerId: layerMap[layerSlug] } },
          update: { content },
          create: { conceptId: created.id, layerId: layerMap[layerSlug], content },
        });
      }
    }

    // Update pack version
    await prisma.packVersion.upsert({
      where: { key: "core" },
      update: { version: 1 },
      create: { key: "core", version: 1 },
    });

    const conceptCount = await prisma.concept.count();
    const dictCount = await prisma.dictionaryTerm.count();
    const layerCount = await prisma.layerDefinition.count();

    return NextResponse.json({ ok: true, conceptCount, dictCount, layerCount });
  } catch (e) {
    console.error("Seed error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
