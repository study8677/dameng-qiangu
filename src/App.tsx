import {
  BookOpen,
  Copy,
  Database,
  Home,
  Library,
  Loader2,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { officialDreams } from './data/dreams'
import { figures } from './data/figures'
import { generateDream } from './lib/aiClient'
import {
  applyChoice,
  createInitialRun,
  getCurrentEnding,
  getCurrentNode,
  getEndingProgressLabel,
} from './lib/game'
import { copyShareLink, decodeSharedDream, encodeSharedDream } from './lib/share'
import {
  deleteSavedDream,
  getSavedDreams,
  saveGeneratedDream,
  type SavedDream,
} from './lib/storage'
import type { Choice, DreamLevel, HistoricalFigure, OfficialFigureId, PlayerRun } from './types'

type Route =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'mine' }
  | { name: 'play'; dreamId: string }
  | { name: 'shared'; encoded: string }

type CreateStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'success'; dream: SavedDream }

type FigureMode = 'official' | 'custom'

const officialDreamById = new Map(officialDreams.map((dream) => [dream.id, dream]))

function parseRoute(): Route {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw || raw === '/' || raw === '/home') return { name: 'home' }
  if (raw.startsWith('dream=')) return { name: 'shared', encoded: raw.slice('dream='.length) }

  const [path] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'create') return { name: 'create' }
  if (parts[0] === 'mine') return { name: 'mine' }
  if (parts[0] === 'play' && parts[1]) return { name: 'play', dreamId: parts[1] }
  return { name: 'home' }
}

function navigate(hash: string) {
  window.location.hash = hash
}

function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute())

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

export default function App() {
  const route = useHashRoute()

  return (
    <div className="app-shell">
      <TopNav />
      {route.name === 'home' && <HomePage />}
      {route.name === 'create' && <CreatePage />}
      {route.name === 'mine' && <MinePage />}
      {route.name === 'play' && <PlayPage dreamId={route.dreamId} />}
      {route.name === 'shared' && <SharedPlayPage encoded={route.encoded} />}
    </div>
  )
}

function TopNav() {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => navigate('/')}>
        <span className="brand-mark">梦</span>
        <span>
          <strong>大梦千古</strong>
          <small>AI 历史伟人梦境</small>
        </span>
      </button>
      <nav>
        <button type="button" onClick={() => navigate('/')}>
          <Home size={17} />
          首页
        </button>
        <button type="button" onClick={() => navigate('/create')}>
          <PenLine size={17} />
          制作梦境
        </button>
        <button type="button" onClick={() => navigate('/mine')}>
          <Library size={17} />
          我的梦境
        </button>
      </nav>
    </header>
  )
}

function HomePage() {
  return (
    <main className="page">
      <section className="intro-grid">
        <div className="intro-copy">
          <p className="eyebrow">清朝以前 · 历史伟人 · 选择闯关</p>
          <h1>进入伟人的梦，在关键一念里改写命运。</h1>
          <p className="lede">
            选择孔子、屈原、诸葛亮、李白、岳飞、王阳明，附身到他们的人生梦境中。
            每一次抉择都会改变智慧、胆识、心性、声望与天命偏差，并通向不同结局。
          </p>
          <div className="action-row">
            <button className="primary" type="button" onClick={() => navigate('/create')}>
              <Sparkles size={18} />
              AI 制作自己的梦境
            </button>
            <button className="secondary" type="button" onClick={() => navigate('/mine')}>
              <Database size={18} />
              查看本机保存
            </button>
          </div>
        </div>
        <div className="featured-panel">
          <img
            src={`${import.meta.env.BASE_URL}covers/zhugeliang.svg`}
            alt="诸葛亮梦境封面"
          />
          <div>
            <span>推荐梦境</span>
            <h2>五丈原最后一盏灯</h2>
            <p>北伐未竟，星火将熄。你要稳扎稳打、强行决战，还是传下遗策？</p>
            <button type="button" onClick={() => navigate('/play/official-zhugeliang')}>
              <Play size={16} />
              进入梦境
            </button>
          </div>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">官方默认梦境</p>
          <h2>先从六位人物开始</h2>
        </div>
        <p>每个梦境 5-7 个节点，至少 3 个结局。无需 AI 也能完整游玩。</p>
      </section>

      <section className="figure-grid">
        {figures.map((figure) => {
          const dream = officialDreamById.get(figure.officialDreamId)
          return (
            <article className="figure-card" key={figure.id}>
              <img src={`${import.meta.env.BASE_URL}${figure.cover}`} alt={`${figure.name}封面`} />
              <div className="figure-card-body">
                <div className="card-meta">
                  <span>{figure.era}</span>
                  <span>{figure.tags.join(' / ')}</span>
                </div>
                <h3>{figure.name}</h3>
                <p>{figure.summary}</p>
                <div className="card-actions">
                  <button
                    className="primary small"
                    type="button"
                    onClick={() => navigate(`/play/${figure.officialDreamId}`)}
                  >
                    <Play size={15} />
                    游玩默认梦境
                  </button>
                  <button
                    className="secondary small"
                    type="button"
                    onClick={() => navigate(`/create?figure=${figure.id}`)}
                  >
                    <PenLine size={15} />
                    基于此人制作
                  </button>
                </div>
                {dream && <small className="dream-title">《{dream.title}》</small>}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}

function CreatePage() {
  const initialFigure = getFigureFromHash() ?? 'zhugeliang'
  const [figureMode, setFigureMode] = useState<FigureMode>('official')
  const [figureId, setFigureId] = useState<OfficialFigureId>(initialFigure)
  const [customName, setCustomName] = useState('苏轼')
  const [customEra, setCustomEra] = useState('北宋')
  const [customTags, setCustomTags] = useState('词人,文臣')
  const [customSummary, setCustomSummary] = useState('在贬谪、才名与家国之间寻找旷达之道。')
  const [theme, setTheme] = useState('功业未竟')
  const [style, setStyle] = useState('庄严')
  const [length, setLength] = useState('短篇')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<CreateStatus>({ state: 'idle' })

  const officialFigure = figures.find((item) => item.id === figureId) ?? figures[0]
  const customFigure = useMemo(
    () => buildCustomFigure(customName, customEra, customTags, customSummary),
    [customEra, customName, customSummary, customTags],
  )
  const figure = figureMode === 'official' ? officialFigure : customFigure

  async function onGenerate() {
    const customError = figureMode === 'custom' ? validateCustomFigure(figure) : null
    if (customError) {
      setStatus({ state: 'error', message: customError })
      return
    }

    setStatus({ state: 'loading' })
    try {
      const dream = await generateDream({ figure, theme, style, length, notes })
      const saved = saveGeneratedDream(dream)
      setStatus({ state: 'success', dream: saved })
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败，请稍后重试。'
      setStatus({ state: 'error', message })
    }
  }

  function saveLocalSample() {
    if (figureMode === 'custom') {
      const customError = validateCustomFigure(figure)
      if (customError) {
        setStatus({ state: 'error', message: customError })
        return
      }

      const saved = saveGeneratedDream(buildCustomSampleDream(figure, theme))
      setStatus({ state: 'success', dream: saved })
      return
    }

    const base = officialDreamById.get(officialFigure.officialDreamId) ?? officialDreams[0]
    const cloned: DreamLevel = {
      ...base,
      id: `local-${officialFigure.id}-${Date.now()}`,
      source: 'local',
      title: `${officialFigure.name} · ${theme}`,
      summary: `基于《${base.title}》生成的本地样例，可先试玩和分享。`,
    }
    const saved = saveGeneratedDream(cloned)
    setStatus({ state: 'success', dream: saved })
  }

  return (
    <main className="page two-column">
      <section className="panel create-panel">
        <p className="eyebrow">AI 创作自己的历史人物梦境</p>
        <h1>选择人物，写下你想让大家游玩的梦。</h1>
        <div className="mode-tabs" aria-label="人物来源">
          <button
            className={figureMode === 'official' ? 'active' : ''}
            type="button"
            aria-pressed={figureMode === 'official'}
            onClick={() => setFigureMode('official')}
          >
            官方人物
          </button>
          <button
            className={figureMode === 'custom' ? 'active' : ''}
            type="button"
            aria-pressed={figureMode === 'custom'}
            onClick={() => setFigureMode('custom')}
          >
            自定义人物
          </button>
        </div>
        {figureMode === 'official' ? (
          <label>
            历史人物
            <select
              value={figureId}
              onChange={(event) => setFigureId(event.target.value as OfficialFigureId)}
            >
              {figures.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.era}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="custom-figure-grid">
            <label>
              人物姓名
              <input value={customName} onChange={(event) => setCustomName(event.target.value)} />
            </label>
            <label>
              所处时代
              <input value={customEra} onChange={(event) => setCustomEra(event.target.value)} />
            </label>
            <label>
              人物标签
              <input value={customTags} onChange={(event) => setCustomTags(event.target.value)} />
            </label>
            <label>
              人物简介
              <textarea
                value={customSummary}
                onChange={(event) => setCustomSummary(event.target.value)}
              />
            </label>
          </div>
        )}
        <label>
          梦境主题
          <input value={theme} onChange={(event) => setTheme(event.target.value)} />
        </label>
        <div className="form-grid">
          <label>
            风格
            <select value={style} onChange={(event) => setStyle(event.target.value)}>
              <option>庄严</option>
              <option>诗意</option>
              <option>悬疑</option>
              <option>温情</option>
              <option>史诗</option>
            </select>
          </label>
          <label>
            长度
            <select value={length} onChange={(event) => setLength(event.target.value)}>
              <option>短篇</option>
              <option>中篇</option>
              <option>长篇</option>
            </select>
          </label>
        </div>
        <label>
          补充设定
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="例如：希望从风波亭前夜开始，让玩家在忠义与改命之间选择。"
          />
        </label>
        <div className="action-row">
          <button className="primary" type="button" onClick={onGenerate} disabled={status.state === 'loading'}>
            {status.state === 'loading' ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            生成梦境
          </button>
          <button className="secondary" type="button" onClick={saveLocalSample}>
            <BookOpen size={18} />
            保存本地样例
          </button>
        </div>
        {status.state === 'error' && <p className="notice error">{status.message}</p>}
        {status.state === 'success' && (
          <div className="notice success">
            <strong>已保存为本机私密梦境。</strong>
            <div className="action-row compact">
              <button type="button" onClick={() => navigate(`/play/${status.dream.id}`)}>
                立即试玩
              </button>
              <button type="button" onClick={() => navigate('/mine')}>
                去复制分享链接
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="panel preview-panel">
        <img src={`${import.meta.env.BASE_URL}${figure.cover}`} alt={`${figure.name}封面`} />
        <h2>{figure.name}</h2>
        <p>{figure.summary}</p>
        <ul>
          <li>官方人物和自定义人物都可以生成梦境。</li>
          <li>自定义人物仍限制为清朝以前历史人物。</li>
          <li>AI 返回结构化关卡 JSON，前端校验后才保存。</li>
          <li>第一版不做账号，分享靠压缩链接。</li>
        </ul>
      </aside>
    </main>
  )
}

function MinePage() {
  const [items, setItems] = useState<SavedDream[]>(() => getSavedDreams())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function refresh() {
    setItems(getSavedDreams())
  }

  async function onCopy(dream: DreamLevel) {
    const url = `${window.location.origin}${window.location.pathname}#dream=${encodeSharedDream(dream)}`
    await copyShareLink(url)
    setCopiedId(dream.id)
  }

  return (
    <main className="page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">本机私密保存</p>
          <h1>我的梦境</h1>
        </div>
        <button className="primary" type="button" onClick={() => navigate('/create')}>
          <PenLine size={17} />
          制作新梦
        </button>
      </section>
      {items.length === 0 ? (
        <section className="empty-state">
          <Sparkles size={36} />
          <h2>还没有自己的梦境</h2>
          <p>去选择一位历史人物，让 AI 帮你制作一个可以分享给别人游玩的梦。</p>
          <button className="primary" type="button" onClick={() => navigate('/create')}>
            开始制作
          </button>
        </section>
      ) : (
        <section className="dream-list">
          {items.map((item) => (
            <article className="dream-row" key={item.id}>
              <div>
                <span className="pill">本机保存</span>
                <h2>{item.dream.title}</h2>
                <p>{item.dream.summary}</p>
                <small>
                  {item.dream.figureName} · {new Date(item.createdAt).toLocaleString('zh-CN')}
                </small>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => navigate(`/play/${item.id}`)}>
                  <Play size={16} />
                  试玩
                </button>
                <button type="button" onClick={() => onCopy(item.dream)}>
                  <Copy size={16} />
                  {copiedId === item.dream.id ? '已复制' : '分享链接'}
                </button>
                <button
                  className="danger"
                  type="button"
                  onClick={() => {
                    deleteSavedDream(item.id)
                    refresh()
                  }}
                >
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

function PlayPage({ dreamId }: { dreamId: string }) {
  const saved = getSavedDreams().find((item) => item.id === dreamId)
  const dream = officialDreamById.get(dreamId) ?? saved?.dream

  if (!dream) {
    return (
      <main className="page">
        <section className="empty-state">
          <h1>没有找到这个梦境</h1>
          <p>它可能已经从本机删除，或链接不完整。</p>
          <button className="primary" type="button" onClick={() => navigate('/')}>
            回到首页
          </button>
        </section>
      </main>
    )
  }

  return <DreamPlayer dream={dream} />
}

function SharedPlayPage({ encoded }: { encoded: string }) {
  const result = useMemo(() => decodeSharedDream(encoded), [encoded])

  if (!result.ok) {
    return (
      <main className="page">
        <section className="empty-state">
          <h1>分享链接无效</h1>
          <p>{result.error}</p>
          <button className="primary" type="button" onClick={() => navigate('/')}>
            回到首页
          </button>
        </section>
      </main>
    )
  }

  return <DreamPlayer dream={{ ...result.dream, source: 'shared' }} shared />
}

function DreamPlayer({ dream, shared = false }: { dream: DreamLevel; shared?: boolean }) {
  const [run, setRun] = useState<PlayerRun>(() => createInitialRun(dream))
  const node = getCurrentNode(dream, run)
  const ending = getCurrentEnding(dream, run)

  function choose(choice: Choice) {
    setRun((current) => applyChoice(dream, current, choice.id))
  }

  return (
    <main className="play-layout">
      <aside className="player-side">
        <img src={resolveCover(dream.cover)} alt={`${dream.figureName}梦境封面`} />
        <span className="pill">{shared ? '分享梦境' : dream.source === 'official' ? '官方梦境' : '本机梦境'}</span>
        <h1>{dream.title}</h1>
        <p>{dream.summary}</p>
        <StatsPanel run={run} />
        <button className="secondary" type="button" onClick={() => setRun(createInitialRun(dream))}>
          <RotateCcw size={16} />
          重新入梦
        </button>
      </aside>
      <section className="event-stage">
        {ending ? (
          <EndingPanel dream={dream} run={run} />
        ) : node ? (
          <>
            <div className="progress-line">
              <span>{dream.figureName}</span>
              <span>{getEndingProgressLabel(dream, run)}</span>
            </div>
            {run.history.at(-1)?.result && (
              <aside className="echo-panel">
                <strong>上一念回响</strong>
                <p>{run.history.at(-1)?.result}</p>
              </aside>
            )}
            <article className="event-card">
              <p className="eyebrow">梦境节点</p>
              <h2>{node.title}</h2>
              <p>{node.body}</p>
            </article>
            <div className="choice-grid">
              {node.choices.map((choice) => (
                <button key={choice.id} className="choice-card" type="button" onClick={() => choose(choice)}>
                  <span>{choice.label}</span>
                  <small>{choice.preview}</small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>梦境节点缺失</h2>
            <button className="primary" type="button" onClick={() => setRun(createInitialRun(dream))}>
              重置梦境
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function StatsPanel({ run }: { run: PlayerRun }) {
  const entries = [
    ['智慧', run.stats.wisdom],
    ['胆识', run.stats.courage],
    ['心性', run.stats.sanity],
    ['声望', run.stats.reputation],
    ['天命偏差', run.stats.fate],
  ] as const

  return (
    <div className="stats-panel">
      {entries.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <meter min="0" max="100" value={value} />
        </div>
      ))}
    </div>
  )
}

function EndingPanel({ dream, run }: { dream: DreamLevel; run: PlayerRun }) {
  const ending = getCurrentEnding(dream, run)
  if (!ending) return null

  return (
    <article className="ending-panel">
      <p className="eyebrow">梦醒时分</p>
      <h1>{ending.title}</h1>
      <p>{ending.body}</p>
      <StatsPanel run={run} />
      <div className="history-list">
        {run.history.map((item, index) => (
          <span key={`${item.nodeId}-${item.choiceId}`}>
            {index + 1}. {item.choiceLabel}：{item.result}
          </span>
        ))}
      </div>
      <div className="action-row">
        <button className="primary" type="button" onClick={() => navigate('/')}>
          回到首页
        </button>
        <button className="secondary" type="button" onClick={() => navigate('/create')}>
          制作自己的梦
        </button>
      </div>
    </article>
  )
}

function getFigureFromHash(): OfficialFigureId | null {
  const query = window.location.hash.split('?')[1]
  if (!query) return null
  const params = new URLSearchParams(query)
  const value = params.get('figure')
  return figures.some((figure) => figure.id === value) ? (value as OfficialFigureId) : null
}

function resolveCover(cover: string) {
  const safeCover = cover.startsWith('covers/') ? cover : 'covers/zhugeliang.svg'
  return `${import.meta.env.BASE_URL}${safeCover}`
}

function buildCustomFigure(name: string, era: string, tags: string, summary: string): HistoricalFigure {
  const trimmedName = name.trim()
  const trimmedEra = era.trim()
  return {
    id: makeCustomFigureId(trimmedName, trimmedEra),
    name: trimmedName,
    era: trimmedEra,
    tags: parseCustomTags(tags),
    summary: summary.trim() || '一位清朝以前历史人物，在关键梦境中面对命运抉择。',
    cover: 'covers/zhugeliang.svg',
    officialDreamId: '',
    custom: true,
  }
}

function parseCustomTags(input: string) {
  const tags = input
    .split(/[,\s，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 12))
    .slice(0, 4)
  return tags.length ? tags : ['自定义']
}

function makeCustomFigureId(name: string, era: string): `custom-${string}` {
  const seed = `${name}-${era}`.trim() || 'figure'
  const encoded = Array.from(seed)
    .map((char) => char.codePointAt(0)?.toString(36) ?? '')
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '')
  return `custom-${encoded || 'figure'}`
}

function validateCustomFigure(figure: HistoricalFigure) {
  if (!figure.name) return '请填写自定义人物姓名。'
  if (!figure.era) return '请填写自定义人物所处时代。'
  if (/(清|民国|近代|现代|当代|共和国|新中国|中华人民共和国)/.test(figure.era)) {
    return 'MVP 只支持清朝以前历史人物，请更换人物时代。'
  }
  return null
}

function buildCustomSampleDream(figure: HistoricalFigure, theme: string): DreamLevel {
  return {
    schemaVersion: 'dream-level-v1',
    id: `local-${figure.id}-${Date.now()}`,
    source: 'local',
    title: `${figure.name} · ${theme || '未竟之梦'}`,
    summary: `围绕${figure.name}的自定义模板梦境，可先试玩、保存和分享。`,
    figureId: figure.id,
    figureName: figure.name,
    era: figure.era,
    cover: figure.cover,
    tags: figure.tags,
    initialStats: {
      wisdom: 58,
      courage: 54,
      sanity: 52,
      reputation: 48,
      fate: 24,
    },
    startNodeId: 'n1',
    nodes: [
      {
        id: 'n1',
        title: '梦门初启',
        body: `${figure.era}的夜色压在案前。你成为${figure.name}，眼前的梦境只剩一个问题：${theme || '这一生该如何被后世记住'}？`,
        choices: [
          customChoice('c1', '直面危局', '把自己推到风暴正中', 'n2', {
            courage: 7,
            reputation: 3,
            fate: 5,
          }),
          customChoice('c2', '先问人心', '从众人的恐惧里寻找答案', 'n3', {
            wisdom: 5,
            sanity: 4,
          }),
          customChoice('c3', '暂避锋芒', '退到暗处等待时机', 'e2', {
            sanity: 3,
            courage: -7,
          }),
        ],
      },
      {
        id: 'n2',
        title: '风雷入局',
        body: '局势骤然逼近，旧友、敌手与百姓都把目光投向你。每一个选择都会写进梦里的史册。',
        choices: [
          customChoice('c1', '孤注一掷', '以胆识撕开困局', 'e1', {
            courage: 8,
            fate: 8,
          }),
          customChoice('c2', '借势而行', '让盟友承担一部分命运', 'n3', {
            wisdom: 5,
            reputation: 4,
          }),
          customChoice('c3', '急求虚名', '用声望掩盖真实危机', 'e3', {
            reputation: 4,
            sanity: -10,
          }),
        ],
      },
      {
        id: 'n3',
        title: '史册将明',
        body: '梦境的最后一页尚未落墨。你看见不同结局在灯影里重叠，等待你亲手选定。',
        choices: [
          customChoice('c1', '守住本心', '把选择交还给良知', 'e4', {
            sanity: 8,
            wisdom: 3,
          }),
          customChoice('c2', '承担代价', '让个人命运为大局让路', 'e1', {
            courage: 6,
            reputation: 5,
          }),
          customChoice('c3', '随波逐势', '用轻松换走沉重责任', 'e3', {
            fate: 7,
            reputation: -8,
          }),
        ],
      },
    ],
    endings: [
      {
        id: 'e1',
        title: '一念开山',
        body: `${figure.name}承担了最沉重的代价，也把梦境推向更开阔的后世。史官写下你的名字时，墨色仍带着风雷。`,
        tone: 'bright',
      },
      {
        id: 'e2',
        title: '暗处余声',
        body: '你避开了最锋利的命运，也错过了最能改变局势的一刻。梦醒后，仍有回声在暗处徘徊。',
        tone: 'quiet',
      },
      {
        id: 'e3',
        title: '浮名成锁',
        body: '声名短暂照亮了你，却也锁住了你。史册没有遗忘，只是写得格外冷。',
        tone: 'warning',
      },
      {
        id: 'e4',
        title: '本心如灯',
        body: '你没有赢下所有局势，却守住了最难被夺走的东西。梦境暗下去时，本心仍亮着。',
        tone: 'bright',
      },
    ],
  }
}

function customChoice(
  id: string,
  label: string,
  intent: string,
  targetId: string,
  effects: DreamLevel['nodes'][number]['choices'][number]['effects'],
) {
  const names: Record<string, string> = {
    wisdom: '智慧',
    courage: '胆识',
    sanity: '心性',
    reputation: '声望',
    fate: '天命偏差',
  }
  const statEcho = Object.entries(effects)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => `${names[key] ?? key}${value > 0 ? '+' : ''}${value}`)
    .join(' / ')
  return {
    id,
    label,
    intent,
    targetId,
    effects,
    preview: intent,
    result: `你选择“${label}”，${intent}。梦境随之改写，${statEcho || '命运偏向了新的方向'}。`,
  }
}
