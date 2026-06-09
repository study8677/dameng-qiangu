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
import type { Choice, DreamLevel, FigureId, PlayerRun } from './types'

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
  const [figureId, setFigureId] = useState<FigureId>(initialFigure)
  const [theme, setTheme] = useState('功业未竟')
  const [style, setStyle] = useState('庄严')
  const [length, setLength] = useState('短篇')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<CreateStatus>({ state: 'idle' })

  const figure = figures.find((item) => item.id === figureId) ?? figures[0]

  async function onGenerate() {
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
    const base = officialDreamById.get(figure.officialDreamId) ?? officialDreams[0]
    const cloned: DreamLevel = {
      ...base,
      id: `local-${figure.id}-${Date.now()}`,
      source: 'local',
      title: `${figure.name} · ${theme}`,
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
        <label>
          历史人物
          <select value={figureId} onChange={(event) => setFigureId(event.target.value as FigureId)}>
            {figures.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.era}
              </option>
            ))}
          </select>
        </label>
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
          <li>只允许生成清朝以前历史人物梦境。</li>
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
            {index + 1}. {item.choiceLabel}
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

function getFigureFromHash(): FigureId | null {
  const query = window.location.hash.split('?')[1]
  if (!query) return null
  const params = new URLSearchParams(query)
  const value = params.get('figure')
  return figures.some((figure) => figure.id === value) ? (value as FigureId) : null
}

function resolveCover(cover: string) {
  const safeCover = cover.startsWith('covers/') ? cover : 'covers/zhugeliang.svg'
  return `${import.meta.env.BASE_URL}${safeCover}`
}
