import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, BarChart2, BookOpen, Smile, X } from 'lucide-react'

const ACCENT = '#F59E0B'

interface MoodEntry {
  id: string
  date: string
  time: string
  mood: number
  emoji: string
  label: string
  note: string
  tags: string[]
}

const MOODS = [
  { score: 1, emoji: '😢', label: 'Awful', color: '#EF4444' },
  { score: 2, emoji: '😔', label: 'Bad', color: '#F97316' },
  { score: 3, emoji: '😐', label: 'Okay', color: '#EAB308' },
  { score: 4, emoji: '😊', label: 'Good', color: '#84CC16' },
  { score: 5, emoji: '😄', label: 'Great', color: '#22C55E' },
]

const TAGS = ['Work', 'Family', 'Exercise', 'Sleep', 'Food', 'Social', 'Health', 'Stress', 'Creative', 'Rest']

function todayStr() { return new Date().toISOString().slice(0, 10) }
function timeStr() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function App() {
  const [entries, setEntries] = useState<MoodEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('mood_entries') || '[]') } catch { return [] }
  })
  const [tab, setTab] = useState<'today' | 'journal' | 'trends'>('today')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null)
  const [note, setNote] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [calMonth, setCalMonth] = useState(new Date())

  useEffect(() => {
    localStorage.setItem('mood_entries', JSON.stringify(entries))
  }, [entries])

  function saveEntry() {
    if (!selectedMood) return
    const entry: MoodEntry = {
      id: Date.now().toString(),
      date: todayStr(),
      time: timeStr(),
      mood: selectedMood.score,
      emoji: selectedMood.emoji,
      label: selectedMood.label,
      note: note.trim(),
      tags: selectedTags,
    }
    setEntries(prev => [entry, ...prev])
    setSelectedMood(null)
    setNote('')
    setSelectedTags([])
    setShowAdd(false)
  }

  const todayEntries = entries.filter(e => e.date === todayStr())
  const todayAvg = todayEntries.length > 0
    ? (todayEntries.reduce((s, e) => s + e.mood, 0) / todayEntries.length).toFixed(1)
    : null

  // Calendar data
  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function moodForDay(dateStr: string) {
    const dayEntries = entries.filter(e => e.date === dateStr)
    if (dayEntries.length === 0) return null
    return dayEntries.reduce((s, e) => s + e.mood, 0) / dayEntries.length
  }

  function moodColor(score: number) {
    const m = MOODS.find(m => m.score === Math.round(score))
    return m?.color || '#555'
  }

  // Trends
  const last30 = entries
    .filter(e => e.date >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))

  const avgMood = last30.length > 0
    ? (last30.reduce((s, e) => s + e.mood, 0) / last30.length).toFixed(1)
    : null

  const tagCounts: Record<string, number> = {}
  entries.forEach(e => e.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 }))
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0F0E0A', minHeight: '100vh', color: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#1A1910', padding: '20px 20px 0', borderBottom: '1px solid #2A2818' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Smile size={22} color={ACCENT} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Mood Journal</div>
            <div style={{ fontSize: 11, color: '#666' }}>Pro</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['today', 'journal', 'trends'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: tab === t ? ACCENT : '#666', fontWeight: tab === t ? 600 : 400, fontSize: 14, borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}` }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>
        {tab === 'today' && (
          <>
            {/* Today summary */}
            <div style={{ background: '#1A1910', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
              {todayAvg ? (
                <>
                  <div style={{ fontSize: 52, marginBottom: 8 }}>
                    {MOODS.find(m => m.score === Math.round(parseFloat(todayAvg)))?.emoji || '😐'}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT }}>{todayAvg}/5</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Today's average mood · {todayEntries.length} entr{todayEntries.length === 1 ? 'y' : 'ies'}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🌅</div>
                  <div style={{ color: '#666', fontSize: 14 }}>How are you feeling today?</div>
                </>
              )}
            </div>

            {/* Today entries */}
            {todayEntries.map(entry => (
              <div key={entry.id} style={{ background: '#1A1910', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: entry.note || entry.tags.length ? 8 : 0 }}>
                  <span style={{ fontSize: 24 }}>{entry.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: moodColor(entry.mood) }}>{entry.label}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{entry.time}</div>
                  </div>
                </div>
                {entry.note && <div style={{ fontSize: 13, color: '#ccc', marginBottom: entry.tags.length ? 8 : 0, lineHeight: 1.5 }}>{entry.note}</div>}
                {entry.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {entry.tags.map(tag => (
                      <span key={tag} style={{ background: ACCENT + '22', color: ACCENT, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add mood */}
            {showAdd ? (
              <div style={{ background: '#1A1910', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontWeight: 600 }}>Log Mood</span>
                  <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
                  {MOODS.map(m => (
                    <button key={m.score} onClick={() => setSelectedMood(m)}
                      style={{ background: selectedMood?.score === m.score ? m.color + '33' : 'none', border: selectedMood?.score === m.score ? `2px solid ${m.color}` : '2px solid transparent', borderRadius: 12, padding: '10px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .2s' }}>
                      <span style={{ fontSize: 28 }}>{m.emoji}</span>
                      <span style={{ fontSize: 10, color: selectedMood?.score === m.score ? m.color : '#666' }}>{m.label}</span>
                    </button>
                  ))}
                </div>
                <textarea placeholder="How are you feeling? (optional)" value={note} onChange={e => setNote(e.target.value)}
                  rows={3}
                  style={{ width: '100%', background: '#2A2818', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14, resize: 'none', marginBottom: 12, boxSizing: 'border-box', lineHeight: 1.5 }} />
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TAGS.map(tag => (
                      <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        style={{ background: selectedTags.includes(tag) ? ACCENT + '33' : '#2A2818', border: selectedTags.includes(tag) ? `1px solid ${ACCENT}` : '1px solid transparent', borderRadius: 8, padding: '4px 12px', color: selectedTags.includes(tag) ? ACCENT : '#888', fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveEntry} disabled={!selectedMood}
                  style={{ width: '100%', background: selectedMood ? ACCENT : '#2A2818', border: 'none', borderRadius: 10, padding: '13px', color: selectedMood ? '#000' : '#555', fontWeight: 600, cursor: selectedMood ? 'pointer' : 'not-allowed', fontSize: 15, transition: 'all .2s' }}>
                  Save Entry
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)}
                style={{ width: '100%', background: ACCENT, border: 'none', borderRadius: 12, padding: '14px', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <Plus size={18} /> Log Mood
              </button>
            )}
          </>
        )}

        {tab === 'journal' && (
          <>
            {/* Calendar */}
            <div style={{ background: '#1A1910', borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => setCalMonth(new Date(year, month - 1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><ChevronLeft size={18} /></button>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalMonth(new Date(year, month + 1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><ChevronRight size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#555', padding: '4px 0' }}>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const avg = moodForDay(dateStr)
                  const isToday = dateStr === todayStr()
                  return (
                    <div key={d} style={{ padding: '4px 0' }}>
                      <div style={{
                        width: 28, height: 28, margin: '0 auto', borderRadius: '50%',
                        background: avg ? moodColor(avg) + '44' : 'none',
                        border: isToday ? `2px solid ${ACCENT}` : avg ? `1px solid ${moodColor(avg)}` : '1px solid #2A2818',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: avg ? '14px' : '11px',
                        color: avg ? moodColor(avg) : '#444',
                      }}>
                        {avg ? MOODS.find(m => m.score === Math.round(avg))?.emoji : d}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent entries */}
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12, fontWeight: 600 }}>RECENT ENTRIES</div>
            {entries.length === 0 && <div style={{ textAlign: 'center', color: '#444', padding: '30px 0', fontSize: 14 }}>No entries yet</div>}
            {entries.slice(0, 20).map(entry => (
              <div key={entry.id} style={{ background: '#1A1910', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1.2 }}>{entry.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: moodColor(entry.mood) }}>{entry.label}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{entry.date === todayStr() ? 'Today' : formatDate(entry.date)} {entry.time}</span>
                  </div>
                  {entry.note && <div style={{ fontSize: 13, color: '#ccc', marginTop: 4, lineHeight: 1.4 }}>{entry.note}</div>}
                  {entry.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {entry.tags.map(t => <span key={t} style={{ background: '#2A2818', color: '#888', borderRadius: 6, padding: '1px 7px', fontSize: 10 }}>{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'trends' && (
          <>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#444', padding: '60px 0', fontSize: 14 }}>Log entries to see trends</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    ['30-day Avg', avgMood ? avgMood + '/5' : '—', '#F59E0B'],
                    ['Total Entries', entries.length, '#60A5FA'],
                    ['Days Tracked', new Set(entries.map(e => e.date)).size, '#4ADE80'],
                    ['Best Mood', entries.length ? MOODS.find(m => m.score === Math.max(...entries.map(e => e.mood)))?.label : '—', '#22C55E'],
                  ].map(([label, val, color]) => (
                    <div key={label as string} style={{ background: '#1A1910', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: color as string }}>{val}</div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* 30-day chart */}
                <div style={{ background: '#1A1910', borderRadius: 16, padding: 18, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Last 30 Days</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
                    {last30.slice(-20).map((e, i) => {
                      const h = (e.mood / 5) * 72
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ height: h, background: moodColor(e.mood), borderRadius: 3, width: '100%', minHeight: 4 }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 6, textAlign: 'center' }}>
                    {last30.length} entries over 30 days
                  </div>
                </div>

                {/* Mood distribution */}
                <div style={{ background: '#1A1910', borderRadius: 16, padding: 18, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Mood Distribution</div>
                  {MOODS.slice().reverse().map(m => {
                    const count = entries.filter(e => e.mood === m.score).length
                    const pct = entries.length ? Math.round((count / entries.length) * 100) : 0
                    return (
                      <div key={m.score} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 18, width: 24 }}>{m.emoji}</span>
                        <div style={{ flex: 1, height: 8, background: '#2A2818', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: m.color, borderRadius: 4, transition: 'width .4s' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#888', width: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>

                {/* Top tags */}
                {topTags.length > 0 && (
                  <div style={{ background: '#1A1910', borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top Tags</div>
                    {topTags.map(([tag, count]) => (
                      <div key={tag} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2A2818', fontSize: 13 }}>
                        <span style={{ color: ACCENT }}>{tag}</span>
                        <span style={{ color: '#888' }}>{count} times</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
