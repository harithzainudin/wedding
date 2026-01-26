<script setup lang="ts">
  import { computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import type { ApexOptions } from 'apexcharts'
  import type { RsvpAnalytics } from '@/types/rsvp'
  import { useDarkMode } from '@/composables/useDarkMode'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    timeline: RsvpAnalytics['timeline']
  }>()

  const { isDark } = useDarkMode()
  const { adminT } = useAdminLanguage()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const chartData = computed(() => {
    return {
      categories: props.timeline.map((t) => formatDate(t.date)),
      cumulative: props.timeline.map((t) => t.cumulative),
      daily: props.timeline.map((t) => t.daily),
    }
  })

  const series = computed(() => [
    {
      name: adminT.value.rsvps.cumulative,
      type: 'area',
      data: chartData.value.cumulative,
    },
    {
      name: adminT.value.rsvps.daily,
      type: 'column',
      data: chartData.value.daily,
    },
  ])

  const chartOptions = computed<ApexOptions>(() => ({
    chart: {
      type: 'line',
      background: 'transparent',
      fontFamily: 'inherit',
      toolbar: {
        show: false,
      },
      stacked: false,
    },
    stroke: {
      width: [3, 0],
      curve: 'smooth',
    },
    fill: {
      type: ['gradient', 'solid'],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    colors: ['#3b82f6', '#22c55e'], // blue-500, green-500
    xaxis: {
      categories: chartData.value.categories,
      labels: {
        style: {
          colors: isDark.value ? '#9ca3af' : '#6b7280',
          fontSize: '11px',
        },
        rotate: -45,
        rotateAlways: props.timeline.length > 7,
      },
    },
    yaxis: [
      {
        title: {
          text: adminT.value.rsvps.cumulative,
          style: {
            color: isDark.value ? '#9ca3af' : '#6b7280',
          },
        },
        labels: {
          style: {
            colors: isDark.value ? '#e5e7eb' : '#374151',
          },
        },
      },
      {
        opposite: true,
        title: {
          text: adminT.value.rsvps.daily,
          style: {
            color: isDark.value ? '#9ca3af' : '#6b7280',
          },
        },
        labels: {
          style: {
            colors: isDark.value ? '#e5e7eb' : '#374151',
          },
        },
      },
    ],
    grid: {
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
    },
    legend: {
      position: 'top',
      labels: {
        colors: isDark.value ? '#e5e7eb' : '#374151',
      },
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      shared: true,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 280 },
          xaxis: {
            labels: { rotate: -60, style: { fontSize: '10px' } },
          },
          legend: { fontSize: '11px' },
        },
      },
    ],
  }))

  const chartKey = computed(() => `timeline-${isDark.value}`)
</script>

<template>
  <div class="chart-container">
    <VueApexCharts
      v-if="timeline.length > 0"
      :key="chartKey"
      type="line"
      height="300"
      :options="chartOptions"
      :series="series"
    />
    <div
      v-else
      class="flex items-center justify-center h-64 text-charcoal-light dark:text-dark-text-secondary"
    >
      {{ adminT.rsvps.noRsvps }}
    </div>
  </div>
</template>

<style scoped>
  .chart-container {
    width: 100%;
    min-height: 200px;
  }
</style>
