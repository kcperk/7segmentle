<template>
  <div class="game-container">
    <h1>7-Segmentle</h1>

    <div class="top-row">
      <div class="keypad" role="main" aria-label="keypad entry">
        <!-- Keypad (primary input) -->
        <h3>Input a Digit</h3>
        <div class="keypad" aria-label="digit keypad">
          <div class="keys">
            <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="onKeypad(n)" :aria-label="`digit ${n}`">
              <SevenSegmentSVG :digit="n" width="40" height="80" />
            </button>
            <div class="zero-row">
              <button class="zero" @click="onKeypad(0)" aria-label="digit 0">
                <SevenSegmentSVG :digit="0" width="40" height="80" />
              </button>
            </div>
          </div>
        </div>
        <div class="meta">Samples: {{ guesses.length }} / {{ maxSamples }}</div>
        <div class="actions">
          <button @click="resetGame(false)">Reset (Daily)</button>
          <button @click="resetGame(true)">New Random Game</button>
          <button @click="revealRules">{{ revealed ? 'Hide Rules' : 'Reveal Rules' }}</button>
        </div>
      </div>

      <div class="play-area" role="main" aria-label="play area">
        <h3>Your Input Results</h3>
        <div class="board">
          <div class="guess-column">
            <div v-for="(g, i) in leftDisplay" :key="`L-${i}`" class="guess-row">
              <template v-if="g">
                <div class="digit-label">Round: {{ i+1 }}<br><br>Input: {{ g.digit }}</div>
                <div class="preview">
                  <SevenSegmentSVG :forcedActive="g.displayed" :highlightIndex="hoverIndex" width="80" height="160" />
                </div>
              </template>
              <template v-else>
                <div class="digit-label placeholder">Round: {{ i+1 }}<br>Input: —</div>
                <div class="preview placeholder">
                  <SevenSegmentSVG width="80" height="160" />
                </div>
              </template>
            </div>
          </div>

          <div class="guess-column">
            <div v-for="(g, i) in rightDisplay" :key="`R-${i}`" class="guess-row">
              <template v-if="g">
                <div class="digit-label">Round: {{ i+5 }}<br><br>Input: {{ g.digit }}</div>
                <div class="preview">
                  <SevenSegmentSVG :forcedActive="g.displayed" :highlightIndex="hoverIndex" width="80" height="160" />
                </div>
              </template>
              <template v-else>
                <div class="digit-label placeholder">Round: {{ i+5 }}<br>Input: —</div>
                <div class="preview placeholder">
                  <SevenSegmentSVG width="80" height="160" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="rules-area" role="complementary" aria-label="rules and controls">
        <h3>Your Rule Guesses</h3>
        <div class="rules-grid">
          <!-- Layout columns to resemble 7-seg: left( F, E ), middle( A, G, D ), right( B, C ) -->
          <div class="col" v-for="(col, cidx) in ruleColumns" :key="cidx">
            <div v-for="seg in col" :key="seg" class="rule-card" @mouseenter="hoverIndex = segmentIds.indexOf(seg)" @mouseleave="hoverIndex = -1">
              <div class="seg-body">
                <div class="candidate-summary" @click.stop="togglePopover(segmentIds.indexOf(seg))">
                  <span v-if="guessedCandidates[segmentIds.indexOf(seg)].length === 0" class="muted">(no candidates)</span>
                  <span v-for="c in guessedCandidates[segmentIds.indexOf(seg)]" :key="c" class="cand-chip">{{ getRuleEmoji(c) }} {{ c }}</span>
                </div>

                <div v-if="popoverOpen[segmentIds.indexOf(seg)]" class="popover" @click.stop>
                  <div class="popover-section">
                    <div class="popover-title">Candidates</div>
                    <label v-for="r in orderedAvailableRules" :key="r" class="cand-label">
                      <input type="checkbox" :value="r" v-model="guessedCandidates[segmentIds.indexOf(seg)]" />
                      <span class="cand-text">{{ getRuleEmoji(r) }} {{ r }}</span>
                    </label>
                  </div>
                  <!-- Removed Done/Clear buttons per compact UX request; popover closes when clicking outside or toggling another segment -->
                </div>
              </div>
              <div v-if="scored.length" :class="['score-dot', scored[segmentIds.indexOf(seg)] ? 'ok' : 'bad']">{{ scored[segmentIds.indexOf(seg)] ? '✓' : '✕' }}</div>
            </div>
          </div>
        </div>
  <button class="submit-rules" @click="submitRuleGuess" :disabled="!allHaveOneChoice || status === 'won'">Submit Rule Guess</button>
  <div class="validation" v-if="!allHaveOneChoice">Please select exactly one candidate for every segment before submitting.</div>

        <div class="legend">
          <h4>Rule legend</h4>
          <ul>
            <li v-for="r in orderedAvailableRules" :key="r">
              <span class="legend-emoji">{{ getRuleEmoji(r) }}</span>
              <strong>{{ r }}</strong>: {{ RULE_DESCRIPTIONS[r] || '' }}
            </li>
          </ul>
        </div>

        <div v-if="status === 'won'" class="banner win">All rules correct — you win!</div>
        <div v-else-if="revealed" class="rules-reveal" aria-live="polite">
          <h4>Actual rules</h4>
          <div class="seg-grid" role="img" aria-label="actual segment rules">
            <div class="cell empty"></div>
            <div class="cell seg seg-A"><div class="seg-letter">A</div><div class="rule-name">{{ actualRules[0] }}</div></div>
            <div class="cell empty"></div>

            <div class="cell seg seg-F"><div class="seg-letter">F</div><div class="rule-name">{{ actualRules[5] }}</div></div>
            <div class="cell seg seg-G"><div class="seg-letter">G</div><div class="rule-name">{{ actualRules[6] }}</div></div>
            <div class="cell seg seg-B"><div class="seg-letter">B</div><div class="rule-name">{{ actualRules[1] }}</div></div>

            <div class="cell seg seg-E"><div class="seg-letter">E</div><div class="rule-name">{{ actualRules[4] }}</div></div>
            <div class="cell seg seg-D"><div class="seg-letter">D</div><div class="rule-name">{{ actualRules[3] }}</div></div>
            <div class="cell seg seg-C"><div class="seg-letter">C</div><div class="rule-name">{{ actualRules[2] }}</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SevenSegmentSVG from './components/SevenSegmentSVG.vue'
import { applyRulesToDigit, RULES } from './utils/feedback.js'

const maxSamples = 8
const segmentIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const todayKey = new Date().toISOString().slice(0, 10)
// currentStorageKey is reactive so we can switch between daily and random persisted games
const currentStorageKey = ref(`ssdle-rules:${todayKey}`)

// availableRules: the subset of RULES that are active for this particular game
const availableRules = ref([])
// map for rule descriptions used in the dynamic legend
const RULE_DESCRIPTIONS = {
  normal: 'segment behaves correctly for digits',
  inverted: 'segment lit when it would normally be off (and vice versa)',
  always_on: 'segment is always lit',
  always_off: 'segment is never lit',
  even_round: 'lit only on even-numbered rounds (2,4,...)',
  odd_round: 'lit only on odd-numbered rounds (1,3,...)',
  even_input: 'lit only for even numeric input (0,2,4,...)',
  odd_input: 'lit only for odd numeric input (1,3,5,...)'
}

// color map for rules (used to color-code legend, pickers, and reveal)
const RULE_COLORS = {
  normal: '#60a5fa',
  inverted: '#fb7185',
  always_on: '#34d399',
  always_off: '#94a3b8',
  even_round: '#f59e0b',
  odd_round: '#f97316',
  even_input: '#a78bfa',
  odd_input: '#06b6d4'
}

function getRuleColor(r) {
  return RULE_COLORS[r] || 'transparent'
}

// emoji map for rule labels (block color emojis)
const RULE_EMOJI = {
  normal: '🟦',
  inverted: '🟥',
  always_on: '🟩',
  always_off: '⬛',
  even_round: '🟨',
  odd_round: '🟧',
  even_input: '🟪',
  odd_input: '🟫'
}

function getRuleEmoji(r) {
  return RULE_EMOJI[r] || '▫️'
}

// actualRules holds the chosen rule for each of the 7 segments for the current game
const actualRules = ref([])
// guesses: each entry will be { digit: '5', displayed: [boolx7], litCount: number, revealing: bool }
const guesses = ref([])
const currentDigit = ref('')
// guessedCandidates: array per segment of possible rules the player is considering
const guessedCandidates = ref(new Array(7).fill(null).map(() => []))
// popover open state per segment
const popoverOpen = ref(new Array(7).fill(false))
const scored = ref([])
const status = ref(null) // 'won'
const revealed = ref(false)

// Columns for rule-guess UI laid out as left, middle, right to mirror seven-seg
const ruleColumns = [['F', 'E'], ['A', 'G', 'D'], ['B', 'C']]
const hoverIndex = ref(-1)

import { computed } from 'vue'

// All segments must have exactly one candidate selected to enable submit
const allHaveOneChoice = computed(() => guessedCandidates.value.every(arr => Array.isArray(arr) && arr.length === 1))

// Toggle a single popover open; ensure only one is open at a time
function togglePopover(idx) {
  const wasOpen = !!popoverOpen.value[idx]
  // close all
  popoverOpen.value = new Array(7).fill(false)
  // if it was closed before, open it now
  if (!wasOpen) popoverOpen.value[idx] = true
}

// Close popovers when clicking outside. Popover elements use @click.stop to prevent propagation.
function handleDocumentClick() {
  // close all popovers
  if (popoverOpen.value.some(Boolean)) {
    popoverOpen.value = new Array(7).fill(false)
  }
}

function padTo4(arr) {
  const out = []
  for (let i = 0; i < 4; i++) out.push(arr[i] ?? null)
  return out
}

const leftDisplay = computed(() => padTo4(guesses.value.slice(0, 4)))
const rightDisplay = computed(() => padTo4(guesses.value.slice(4, 8)))

// orderedAvailableRules: available rules presented in the canonical RULES order
const orderedAvailableRules = computed(() => RULES.filter(r => availableRules.value.includes(r)))

function hashString(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i) + i
    h = h & 0xffffffff
  }
  return Math.abs(h)
}

function buildAvailableRulesForDate(date = new Date()) {
  const seed = hashString(date.toISOString().slice(0,10))
  // number of rules between 3 and RULES.length
  const minRules = 3
  const maxRules = RULES.length
  const range = maxRules - minRules + 1
  const k = minRules + (seed % range)
  // always include 'normal'
  const others = RULES.filter(r => r !== 'normal')
  const chosen = ['normal']
  // pick deterministically from others
  let idx = seed % others.length
  while (chosen.length < k) {
    const r = others[idx % others.length]
    if (!chosen.includes(r)) chosen.push(r)
    idx++
  }
  return chosen
}

function buildAvailableRulesRandom(rng = Math.random) {
  const minRules = 3
  const maxRules = RULES.length
  const k = minRules + Math.floor(rng() * (maxRules - minRules + 1))
  const others = RULES.filter(r => r !== 'normal')
  const chosen = ['normal']
  while (chosen.length < k) {
    const r = others[Math.floor(rng() * others.length)]
    if (!chosen.includes(r)) chosen.push(r)
  }
  return chosen
}

function buildActualRulesFromAvailableForDate(date = new Date()) {
  const seed = hashString(date.toISOString().slice(0,10))
  const rules = []
  for (let i = 0; i < 7; i++) {
    const list = availableRules.value
    const idx = (seed + i) % list.length
    rules.push(list[idx])
  }
  return rules
}

function buildActualRulesFromAvailableRandom(rng = Math.random) {
  const rules = []
  for (let i = 0; i < 7; i++) rules.push(availableRules.value[Math.floor(rng() * availableRules.value.length)])
  return rules
}

function persist() {
  localStorage.setItem(currentStorageKey.value, JSON.stringify({ rules: actualRules.value, availableRules: availableRules.value, guesses: guesses.value }))
}

function loadPersist() {
  const p = JSON.parse(localStorage.getItem(currentStorageKey.value) || 'null')
  if (p?.rules) actualRules.value = p.rules
  if (p?.availableRules) availableRules.value = p.availableRules
  if (p?.guesses) guesses.value = p.guesses
}

function onKeydown(e) {
  const k = e.key
  if (/^[0-9]$/.test(k)) {
    currentDigit.value = k
    e.preventDefault()
  } else if (k === 'Enter') {
    submitDigit()
    e.preventDefault()
  } else if (k === 'Backspace') {
    currentDigit.value = ''
    e.preventDefault()
  }
}

function onKeypad(n) {
  currentDigit.value = String(n)
  // submit immediately for quick play
  submitDigit()
}

function submitDigit() {
  if (!/^[0-9]$/.test(currentDigit.value)) return
  if (guesses.value.length >= maxSamples) return
  const guessNumber = guesses.value.length + 1
  const target = applyRulesToDigit(actualRules.value, currentDigit.value, Math.random, guessNumber)

  const guessObj = { digit: currentDigit.value, displayed: target.slice(), litCount: target.filter(Boolean).length }
  guesses.value.push(guessObj)
  // clear input after submit
  currentDigit.value = ''
  persist()
}

function submitRuleGuess() {
  // require exactly one candidate per segment
  if (!allHaveOneChoice.value) {
    // simple UX: do nothing (button will normally be disabled). Could flash or show a message.
    return
  }
  const res = actualRules.value.map((a, i) => {
    const choiceArr = guessedCandidates.value[i] || []
    const choice = choiceArr[0]
    return !!choice && choice === a
  })
  scored.value = res
  if (res.every(Boolean)) {
    status.value = 'won'
  }
}

function revealRules() {
  revealed.value = !revealed.value
}

function resetGame(random = false) {
  // switch to random or daily game and reset state
  if (random) {
    currentStorageKey.value = 'ssdle-rules:random'
    // build a random available-rules set and then pick actual rules from it
    availableRules.value = buildAvailableRulesRandom()
    actualRules.value = buildActualRulesFromAvailableRandom()
  } else {
    currentStorageKey.value = `ssdle-rules:${todayKey}`
    // build deterministic available rules for today and pick actual rules deterministically
    availableRules.value = buildAvailableRulesForDate(new Date())
    actualRules.value = buildActualRulesFromAvailableForDate(new Date())
  }
  // clear persisted key and state
  localStorage.removeItem(currentStorageKey.value)
  guesses.value = []
  guessedCandidates.value = new Array(7).fill(null).map(() => [])
  popoverOpen.value = new Array(7).fill(false)
  scored.value = []
  status.value = null
  revealed.value = false
  persist()
}

onMounted(() => {
  loadPersist()
  // if nothing persisted, initialize today's game
  if (!availableRules.value || availableRules.value.length === 0) {
    availableRules.value = buildAvailableRulesForDate(new Date())
  }
  if (!actualRules.value || actualRules.value.length === 0) {
    actualRules.value = buildActualRulesFromAvailableForDate(new Date())
  }
  // register a document click handler to close popovers when clicking outside
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style>
body {
  font-family: sans-serif;
  background-color: #0b1020;
  color: #eee;
  text-align: center;
  padding: 1.5rem;
}
.game-container { max-width: 1000px; margin: 0 auto }
.top-row { display: flex; gap: 1.5rem; justify-content: center; align-items: flex-start }
.play-area { flex: 1; background: linear-gradient(180deg,#071226 0%, #071428 100%); padding: 1rem; border-radius: 8px; box-shadow: 0 6px 18px rgba(2,6,23,0.6) }
.rules-area { position: sticky; top: 1.5rem; align-self: start; z-index: 5; background: #071428; padding: 0.9rem; border-radius: 8px; border-left: 1px solid rgba(255,255,255,0.03) }
.board { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem }
.guess-column { display: flex; flex-direction: column; gap: 0.6rem; align-items: center }
.guess-row { display: flex; gap: 1rem; align-items: center }
.digit-label { color: #cbd5e1 }
.digit-label.placeholder { opacity: 0.35 }
input { padding: 0.4rem; text-align: center }
/* keypad */
.keypad { margin-top: 0.6rem }
.keypad .keys { display: grid; grid-template-columns: repeat(3, 54px); gap: 8px; justify-content: center }
.keypad button { background: #0b1220; border: 1px solid #2b3445; color: #e6eef8; padding: 6px; border-radius: 6px; cursor: pointer; display:flex; align-items:center; justify-content:center }
.keypad button:disabled { opacity: 0.5; cursor: not-allowed }
.keypad .zero-row { grid-column: 1 / -1; display:flex; justify-content:center }
.keypad .zero { width: 57px }

/* ensure the inline SVGs fit nicely */
.keypad button svg { display: block }

.preview { position: relative; display: inline-block }
.rules-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; align-items: start }
.rules-grid .col { display: flex; flex-direction: column; gap: 0.5rem }
.rules-grid .col:nth-child(1) { margin: 1.5rem }
.rules-grid .col:nth-child(3) { margin: 1.5rem }
.rule-card { background: #071029; padding: 0.6rem; border-radius: 6px; display:flex; align-items:center; gap:0.6rem }
.rule-card .seg-body { display:flex; flex-direction:column; align-items:flex-start }
.candidate-summary { display:flex; align-items:center; gap:8px; cursor:pointer }
.cand-chip { background: rgba(255,255,255,0.03); padding: 4px 6px; border-radius: 4px; font-size: 0.85rem }
.muted { color: rgba(255,255,255,0.35) }
.choice { color: #a0aec0; margin-left: 6px }
.edit-btn { margin-left: auto; background: transparent; border: 1px solid rgba(255,255,255,0.03); color: #cbd5e1; padding: 2px 6px; border-radius: 4px; cursor: pointer }
.popover { margin-top: 6px; background: #0b1220; border: 1px solid rgba(255,255,255,0.03); padding: 8px; border-radius: 6px; box-shadow: 0 6px 18px rgba(2,6,23,0.6); z-index: 10 }
.popover-section { margin-bottom: 8px }
.popover-title { font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px }
.cand-label { display:flex; align-items:center; gap:8px; margin-bottom:6px }
.cand-text { color: #e6eef8 }
.popover-actions { display:flex; gap:8px; justify-content:flex-end }
.rules-reveal { margin-top: 0.6rem; text-align: center }
.seg-grid { display: grid; grid-template-columns: repeat(3, 80px); gap: 8px; justify-content: center; align-items: center }
.seg-grid .cell { background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; min-height: 56px; display:flex; flex-direction:column; align-items:center; justify-content:center }
.seg-grid .cell.empty { background: transparent }
.seg-letter { font-weight: 700; color: #cbd5e1; margin-bottom: 4px }
.rule-name { font-size: 0.8rem; color: #aeb8c8; text-align:center; max-width: 68px; word-break: break-word }
.legend li { display:flex; align-items:flex-start; gap:8px; margin-bottom:6px }
.legend-emoji { font-size: 1.1rem; line-height: 1; margin-right: 6px }
.legend { margin-top: 0.6rem; text-align: left; background: #071428; padding: 0.6rem; border-radius: 6px }
.legend ul { margin: 0.4rem 0 0 1rem }
.seg-label { width: 18px }
.score-dot.ok { color: #34d399 }
.score-dot.bad { color: #fb7185 }
.banner { margin-top: 0.6rem; padding: 0.6rem 1rem; border-radius: 6px }
.win { background: #166534; color: #bbf7d0 }
.info { background: #0f172a; color: #c7d2fe }
.submit-rules { margin-top: 0.6rem }
.actions { margin-top: 0.6rem }
.validation { margin-top: 0.4rem; color: #fca5a5; font-size: 0.95rem }
</style>
