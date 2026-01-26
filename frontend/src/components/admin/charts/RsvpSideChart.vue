<script setup lang="ts">
  import { computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import type { ApexOptions } from 'apexcharts'
  import type { RsvpAnalytics } from '@/types/rsvp'
  import { useDarkMode } from '@/composables/useDarkMode'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    bySide: NonNullable<RsvpAnalytics['bySide']>
  }>()

  const { isDark } = useDarkMode()
  const { adminT } = useAdminLanguage()

  const chartData = computed(() => {
    const t = adminT.value.rsvps
    return {
      categories: [t.brideSide, t.groomSide, t.mutualOther, t.notSpecified],
      guests: [
        props.bySide.bride.guests,
        props.bySide.groom.guests,
        props.bySide.mutual.guests,
        props.bySide.unknown.guests,
      ],
      entries: [
        props.bySide.bride.entries,
        props.bySide.groom.entries,
        props.bySide.mutual.entries,
        props.bySide.unknown.entries,
      ],
    }
  })

  const series = computed(() => [
    {
      name: adminT.value.rsvps.guestsLabel,
      data: chartData.value.guests,
    },
  ])

  const chartOptions = computed<ApexOptions>(() => ({
    chart: {
      type: 'bar',
      background: 'transparent',
      fontFamily: 'inherit',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '60%',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    colors: ['#ec4899', '#3b82f6', '#a855f7', '#9ca3af'], // pink, blue, purple, gray
    xaxis: {
      categories: chartData.value.categories,
      labels: {
        style: {
          colors: isDark.value ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark.value ? '#e5e7eb' : '#374151',
          fontSize: '12px',
        },
      },
    },
    grid: {
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      y: {
        formatter: (val: number, opts) => {
          const entries = chartData.value.entries[opts.dataPointIndex]
          return `${val} ${adminT.value.rsvps.guestsLabel} (${entries} ${adminT.value.rsvps.entries})`
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 220 },
          yaxis: {
            labels: { style: { fontSize: '10px' } },
          },
        },
      },
    ],
  }))

  const chartKey = computed(() => `side-${isDark.value}`)
</script>

<template>
  <div class="chart-container">
    <VueApexCharts
      :key="chartKey"
      type="bar"
      height="220"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<style scoped>
  .chart-container {
    width: 100%;
    min-height: 180px;
  }
</style>
