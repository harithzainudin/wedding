<script setup lang="ts">
  import { computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import type { ApexOptions } from 'apexcharts'
  import { useDarkMode } from '@/composables/useDarkMode'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    attending: number
    notAttending: number
  }>()

  const { isDark } = useDarkMode()
  const { adminT } = useAdminLanguage()

  const series = computed(() => [props.attending, props.notAttending])

  const chartOptions = computed<ApexOptions>(() => ({
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'inherit',
    },
    labels: [adminT.value.rsvps.attending, adminT.value.rsvps.notAttending],
    colors: ['#22c55e', '#ef4444'], // green-500, red-500
    legend: {
      position: 'bottom',
      labels: {
        colors: isDark.value ? '#e5e7eb' : '#374151',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: {
        fontSize: '14px',
        fontWeight: 600,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: isDark.value ? '#e5e7eb' : '#374151',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: isDark.value ? '#e5e7eb' : '#374151',
            },
            total: {
              show: true,
              label: adminT.value.rsvps.totalRsvps,
              color: isDark.value ? '#9ca3af' : '#6b7280',
              fontSize: '12px',
              formatter: () => String(props.attending + props.notAttending),
            },
          },
        },
      },
    },
    stroke: {
      show: false,
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      y: {
        formatter: (val: number) => `${val} ${adminT.value.rsvps.entries}`,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 250 },
          legend: { position: 'bottom', fontSize: '12px' },
        },
      },
    ],
  }))

  // Key to force re-render when dark mode changes
  const chartKey = computed(() => `attendance-${isDark.value}`)
</script>

<template>
  <div class="chart-container">
    <VueApexCharts
      :key="chartKey"
      type="donut"
      height="280"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<style scoped>
  .chart-container {
    width: 100%;
    min-height: 200px;
  }
</style>
