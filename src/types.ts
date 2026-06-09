export type FigureId =
  | 'confucius'
  | 'quyuan'
  | 'zhugeliang'
  | 'libai'
  | 'yuefei'
  | 'wangyangming'

export type StatKey = 'wisdom' | 'courage' | 'sanity' | 'reputation' | 'fate'

export type StatBlock = Record<StatKey, number>

export type DreamSource = 'official' | 'ai' | 'local' | 'shared'

export type HistoricalFigure = {
  id: FigureId
  name: string
  era: string
  tags: string[]
  summary: string
  cover: string
  officialDreamId: string
}

export type Choice = {
  id: string
  label: string
  intent: string
  targetId: string
  preview: string
  effects: Partial<StatBlock>
}

export type DreamNode = {
  id: string
  title: string
  body: string
  choices: Choice[]
}

export type DreamEnding = {
  id: string
  title: string
  body: string
  tone: 'bright' | 'tragic' | 'quiet' | 'warning'
}

export type DreamLevel = {
  schemaVersion: 'dream-level-v1'
  id: string
  source: DreamSource
  title: string
  summary: string
  figureId: FigureId
  figureName: string
  era: string
  cover: string
  tags: string[]
  initialStats: StatBlock
  startNodeId: string
  nodes: DreamNode[]
  endings: DreamEnding[]
}

export type PlayerRun = {
  dreamId: string
  currentNodeId: string
  stats: StatBlock
  history: Array<{
    nodeId: string
    nodeTitle: string
    choiceId: string
    choiceLabel: string
  }>
  endingId: string | null
}

export type GenerateDreamRequest = {
  figure: HistoricalFigure
  theme: string
  style: string
  length: string
  notes: string
}
