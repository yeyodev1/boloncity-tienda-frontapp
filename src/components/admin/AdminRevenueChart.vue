<script setup lang="ts">
import type { OrderDTO } from '@/services/OrderService'
import AdminMetricLineChart from './AdminMetricLineChart.vue'
defineProps<{ orders: OrderDTO[] }>()
</script>

<template><AdminMetricLineChart :orders="orders" metric="revenue" /></template>
