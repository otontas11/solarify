<template>
  <div class="btn-group" :class="groupClass">
    <button
        v-for="item in options"
        :key="item.value"
        type="button"
        :class="{ active: modelValue === item.value }"
        @click="$emit('update:modelValue', item.value)"
    >
      <span v-if="item.icon" class="btn-group-icon">{{ item.icon }}</span>
      <strong>{{ item.label }}</strong>
      <span v-if="item.description" class="btn-group-desc">{{ item.description }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, required: true },
  groupClass: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>
