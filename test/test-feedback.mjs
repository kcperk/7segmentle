import assert from 'assert'
import { computeFeedback } from '../src/utils/feedback.js'

// Simple tests for computeFeedback
function eq(a, b) {
  assert.deepStrictEqual(a, b)
}

// test 1: all correct
eq(computeFeedback('1234', '1234'), ['correct', 'correct', 'correct', 'correct'])

// test 2: present and absent
eq(computeFeedback('1234', '4321'), ['present', 'present', 'present', 'present'])

// test 3: duplicates in guess
// target has single '1' in position 0; guess repeats '1'
eq(computeFeedback('1023', '1111'), ['correct', 'absent', 'absent', 'absent'])

// test 4: repeated digits in target
eq(computeFeedback('1122', '1212'), ['correct', 'present', 'present', 'correct'])

console.log('All computeFeedback tests passed')
