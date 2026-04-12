<template>
  <!-- Range slider -->
  <div v-if="type === 'range'" class="range-field">
    <div class="range-header">
      <span>{{ label }}</span>
      <strong>{{ displayValue }}</strong>
    </div>
    <input
        :value="modelValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        @input="$emit('update:modelValue', Number($event.target.value))"
    />
  </div>

  <!-- Checkbox -->
  <label v-else-if="type === 'checkbox'" class="checkbox-field">
    <input
        :checked="modelValue"
        type="checkbox"
        @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span>{{ label }}</span>
  </label>

  <!-- Number input (standalone with label) -->
  <label v-else-if="!inline" class="form-input-label">
    <span>{{ label }}</span>
    <input
        :value="modelValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :placeholder="placeholder"
        :class="inputClass"
        @input="$emit('update:modelValue', Number($event.target.value))"
    />
  </label>

  <!-- Number input (inline / tariff style) -->
  <div v-else class="tariff-input-wrap">
    <input
        :value="modelValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        class="tariff-input"
        @input="$emit('update:modelValue', Number($event.target.value))"
    />
    <span v-if="suffix" class="tariff-unit">{{ suffix }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [Number, Boolean, String], default: null },
  label: { type: String, default: '' },
  type: { type: String, default: 'number' },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  step: { type: [Number, String], default: undefined },
  suffix: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  inline: { type: Boolean, default: false },
  inputClass: { type: String, default: '' },
  format: { type: Function, default: null },
})

defineEmits(['update:modelValue'])

const displayValue = computed(() => {
  if (props.format) return props.format(props.modelValue)
  if (props.suffix) return `${props.modelValue}${props.suffix}`
  return String(props.modelValue)
})
</script>
