// Small utility functions for computing feedback and daily target
export function computeFeedback(target, guess) {
  // target and guess should be strings of equal length
  const len = target.length
  const result = new Array(len).fill('absent')

  // convert to arrays so we can mark consumed characters
  const targetArr = target.split('')
  const guessArr = guess.split('')

  // First pass: exact matches
  for (let i = 0; i < len; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct'
      targetArr[i] = null
      guessArr[i] = null
    }
  }

  // Second pass: present elsewhere
  for (let i = 0; i < len; i++) {
    if (guessArr[i] == null) continue
    const idx = targetArr.indexOf(guessArr[i])
    if (idx !== -1) {
      result[i] = 'present'
      targetArr[idx] = null
    }
  }

  return result
}

// Deterministic daily 0-padded numeric target based on date
export function getDailyTarget(date = new Date(), digits = 4) {
  const ymd = date.toISOString().slice(0, 10) // YYYY-MM-DD
  // simple hash (djb2)
  let hash = 5381
  for (let i = 0; i < ymd.length; i++) {
    hash = ((hash << 5) + hash) + ymd.charCodeAt(i)
    hash = hash & 0xffffffff
  }
  const max = Math.pow(10, digits)
  const num = Math.abs(hash) % max
  return String(num).padStart(digits, '0')
}

export function isValidGuess(s, length) {
  return typeof s === 'string' && s.length === length && /^\d+$/.test(s)
}

// Base segment definitions (same order as used by the SVG component)
export const baseSegments = [
  { id: 'A', points: '20,10 80,10 70,20 30,20', on: [0,2,3,5,6,7,8,9] },
  { id: 'B', points: '80,10 90,20 90,90 80,100 70,90 70,20', on: [0,1,2,3,4,7,8,9] },
  { id: 'C', points: '80,100 90,110 90,180 80,190 70,180 70,110', on: [0,1,3,4,5,6,7,8,9] },
  { id: 'D', points: '20,190 80,190 70,180 30,180', on: [0,2,3,5,6,8,9] },
  { id: 'E', points: '20,100 30,110 30,180 20,190 10,180 10,110', on: [0,2,6,8] },
  { id: 'F', points: '20,10 30,20 30,90 20,100 10,90 10,20', on: [0,4,5,6,8,9] },
  { id: 'G', points: '20,100 80,100 70,90 30,90', on: [2,3,4,5,6,8,9] }
]

export const RULES = ['normal', 'inverted', 'always_on', 'always_off', 'even_round', 'odd_round', 'even_input', 'odd_input']

// Deterministic per-day rules based on date string (YYYY-MM-DD)
export function getDailyRules(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10)
  let hash = 5381
  for (let i = 0; i < ymd.length; i++) {
    hash = ((hash << 5) + hash) + ymd.charCodeAt(i) + i
    hash = hash & 0xffffffff
  }
  const rules = []
  // Deterministically pick each segment's rule from the full RULES list.
  // This allows daily games to include any number of parity rules (even/odd).
  for (let i = 0; i < baseSegments.length; i++) {
    const r = Math.abs((hash + i) % RULES.length)
    rules.push(RULES[r])
  }
  return rules
}

// Generate random rules (useful for non-daily random games)
export function getRandomRules(rng = Math.random) {
  // For random games, pick each segment's rule independently from the full RULES list.
  // This allows any number of parity rules (including zero).
  const rules = []
  for (let i = 0; i < baseSegments.length; i++) {
    const r = Math.floor(rng() * RULES.length)
    rules.push(RULES[r])
  }
  return rules
}

// Apply rules to a digit and return an array of booleans indicating whether each segment is lit
export function applyRulesToDigit(rules, digit, rng = Math.random, guessNumber = null) {
  const n = Number(digit)
  const isValid = Number.isInteger(n) && n >= 0 && n <= 9
  return baseSegments.map((seg, idx) => {
    const normal = isValid ? seg.on.includes(n) : false
    const rule = rules[idx]
    switch (rule) {
      case 'always_on': return true
      case 'always_off': return false
      case 'inverted': return !normal
      case 'even_round':
        return typeof guessNumber === 'number' ? (guessNumber % 2 === 0) : false
      case 'odd_round':
        return typeof guessNumber === 'number' ? (guessNumber % 2 === 1) : false
      case 'even_input':
        return typeof n === 'number' ? (n % 2 === 0) : false
      case 'odd_input':
        return typeof n === 'number' ? (n % 2 === 1) : false
      case 'normal':
      default:
        return normal
    }
  })
}

export function scoreRuleGuess(actualRules, guessedRules) {
  // returns array of booleans whether each rule matches
  return actualRules.map((r, i) => r === guessedRules[i])
}

