<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 100 200"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g
      v-for="(seg, index) in segments"
      :key="index"
    :class="['segment', { active: seg.active, [seg.state]: !!seg.state, highlight: seg.highlight }]"
    >
      <polygon :points="seg.points" />
    </g>
  </svg>
</template>

<script setup>
import { ref, watch } from 'vue'
import { baseSegments } from '../utils/feedback.js'

const props = defineProps({
  // accept Number or String and coerce below
  digit: { type: [Number, String], required: false },
  feedback: { type: String, default: null },
  width: { type: Number, default: 100 },
  height: { type: Number, default: 200 },
  // Optional override for active segments: array[7] of booleans
  forcedActive: { type: Array, required: false },
  // Optional highlighted segment index (0-6)
  highlightIndex: { type: Number, required: false }
})

const segments = ref([])

function buildSegments(digit, feedback, forcedActive) {
  // if forcedActive provided, it overrides normal computation
  const n = Number(digit)
  const isValid = Number.isInteger(n) && n >= 0 && n <= 9
  segments.value = baseSegments.map((s, idx) => ({
    ...s,
    active: Array.isArray(forcedActive) ? !!forcedActive[idx] : (isValid ? s.on.includes(n) : false),
    state: feedback,
    highlight: typeof props.highlightIndex === 'number' && props.highlightIndex === idx
  }))
}

watch(
  () => [props.digit, props.feedback, props.forcedActive, props.highlightIndex],
  () => buildSegments(props.digit, props.feedback, props.forcedActive),
  { immediate: true }
)
</script>

<style scoped>
.segment polygon {
  fill: #333;
  transition: fill 0.3s ease-in-out;
}
.segment.active polygon {
  fill: #ff3333;
}
.segment.correct polygon {
  fill: #4ade80;
}
.segment.present polygon {
  fill: #facc15;
}
.segment.absent polygon {
  fill: #374151;
}
.segment.highlight polygon {
  stroke: #facc15;
  stroke-width: 3px;
  filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.6));
}
</style>
