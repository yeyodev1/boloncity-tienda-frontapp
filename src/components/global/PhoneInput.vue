<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  countryCode?: string
}>(), {
  countryCode: '+593',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:countryCode': [value: string]
}>()

const open = ref(false)
const localCode = ref(props.countryCode)
const localNumber = ref(props.modelValue.replace(/^\+?\d{1,3}\s?/, ''))

const countries = [
  { code: '+593', flag: '🇪🇨', label: 'Ecuador' },
  { code: '+57', flag: '🇨🇴', label: 'Colombia' },
  { code: '+51', flag: '🇵🇪', label: 'Perú' },
  { code: '+54', flag: '🇦🇷', label: 'Argentina' },
  { code: '+52', flag: '🇲🇽', label: 'México' },
  { code: '+1', flag: '🇺🇸', label: 'Estados Unidos' },
]

const defaultCountry = countries[0]!
const selected = computed(() => countries.find((c) => c.code === localCode.value) || defaultCountry)

watch(localCode, (code) => {
  emit('update:countryCode', code)
  emit('update:modelValue', `${code} ${localNumber.value}`)
})

watch(localNumber, (num) => {
  emit('update:modelValue', `${localCode.value} ${num}`)
})

function selectCountry(code: string) {
  localCode.value = code
  open.value = false
}

</script>

<template>
  <div class="pi-wrap" @click.stop>
    <div class="pi-trigger" @click="open = !open">
      <span class="pi-flag">{{ selected?.flag || '🇪🇨' }}</span>
      <span class="pi-code">{{ selected?.code || '+593' }}</span>
      <i class="fa-solid fa-chevron-down" :class="{ open }" />
    </div>
    <Transition name="pi-drop">
      <div v-if="open" class="pi-dropdown">
        <button
          v-for="c in countries"
          :key="c.code"
          class="pi-option"
          :class="{ active: c.code === localCode }"
          @click="selectCountry(c.code)"
        >
          <span class="pi-flag">{{ c.flag }}</span>
          <span class="pi-option-label">{{ c.label }}</span>
          <span class="pi-option-code">{{ c.code }}</span>
          <i v-if="c.code === localCode" class="fa-solid fa-check pi-check" />
        </button>
      </div>
    </Transition>
    <input
      class="pi-input"
      :value="localNumber"
      @input="localNumber = ($event.target as HTMLInputElement).value.replace(/[^0-9]/g, '')"
      type="tel"
      placeholder="99 999 9999"
      maxlength="15"
    />
  </div>
</template>

<style scoped lang="scss">
.pi-wrap {
  align-items: center;
  background: rgba(8, 17, 13, 0.02);
  border: 1px solid rgba(35, 89, 49, 0.07);
  border-radius: 12px;
  display: flex;
  gap: 0;
  overflow: visible;
  position: relative;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.pi-wrap:focus-within {
  background: #fff;
  border-color: #235931;
  box-shadow: 0 0 0 4px rgba(35, 89, 49, 0.06);
}

.pi-trigger {
  align-items: center;
  background: rgba(8, 17, 13, 0.02);
  border: 0;
  border-radius: 12px 0 0 12px;
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  gap: 0.3rem;
  min-height: 44px;
  padding: 0 0.6rem 0 0.75rem;
  position: relative;
  transition: background 0.15s ease;
  z-index: 2;
}

.pi-trigger::after {
  background: rgba(35, 89, 49, 0.06);
  content: '';
  height: 20px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
}

.pi-trigger:hover { background: rgba(35, 89, 49, 0.04); }

.pi-flag { font-size: 1.2rem; line-height: 1; }

.pi-code {
  color: rgba(8, 17, 13, 0.6);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.pi-trigger i {
  color: rgba(8, 17, 13, 0.2);
  font-size: 0.65rem;
  transition: transform 0.2s ease;
}

.pi-trigger i.open { transform: rotate(180deg); }

.pi-dropdown {
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  left: 0;
  min-width: 240px;
  overflow: hidden;
  padding: 0.3rem;
  position: absolute;
  top: calc(100% + 6px);
  z-index: 999;
}

.pi-option {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: rgba(8, 17, 13, 0.7);
  cursor: pointer;
  display: flex;
  font-size: 0.85rem;
  font-weight: 600;
  gap: 0.55rem;
  min-height: 40px;
  padding: 0.3rem 0.6rem;
  text-align: left;
  transition: background 0.15s ease;
  width: 100%;
}

.pi-option:hover { background: rgba(35, 89, 49, 0.06); }
.pi-option.active { background: rgba(35, 89, 49, 0.06); color: #235931; }

.pi-option .pi-flag { font-size: 1.1rem; }

.pi-option-label { flex: 1; }

.pi-option-code {
  color: rgba(8, 17, 13, 0.3);
  font-size: 0.8rem;
  font-weight: 500;
}

.pi-check { color: #235931; font-size: 0.75rem; }

.pi-input {
  background: transparent;
  border: 0;
  flex: 1;
  font-size: 0.92rem;
  min-height: 44px;
  min-width: 0;
  outline: none;
  padding: 0 0.85rem;
}

.pi-input::placeholder { color: rgba(8, 17, 13, 0.2); }

.pi-drop-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.pi-drop-leave-active { transition: all 0.15s ease; }
.pi-drop-enter-from { opacity: 0; transform: translateY(-6px) scale(0.96); }
.pi-drop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.96); }
</style>
