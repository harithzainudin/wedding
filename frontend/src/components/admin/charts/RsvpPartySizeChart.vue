<script setup lang="ts">
  import { computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import type { ApexOptions } from 'apexcharts'
  import type { RsvpAnalytics } from '@/types/rsvp'
  import { useDarkMode } from '@/composables/useDarkMode'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    distribution: RsvpAnalytics['partySizeDistribution']
  }>()

  const { isDark } = useDarkMode()
  const { adminT } = useAdminLanguage()

  const chartData = computed(() => {
    const t = adminT.value.rsvps
    return {
      categories: [
        `1 ${t.person}`,
        `2 ${t.people}`,
        `3 ${t.people}`,
        `4 ${t.people}`,
        `5+ ${t.people}`,
      ],
      values: [
        props.distribution['1'],
        props.distribution['2'],
        props.distribution['3'],
        props.distribution['4'],
        props.distribution['5+'],
      ],
    }
  })

  const series = computed(() => [
    {
      name: adminT.value.rsvps.entries,
      data: chartData.value.values,
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
        borderRadius: 4,
        columnWidth: '60%',
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
    colors: ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'], // cyan to purple gradient
    xaxis: {
      categories: chartData.value.categories,
      labels: {
        style: {
          colors: isDark.value ? '#e5e7eb' : '#374151',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark.value ? '#9ca3af' : '#6b7280',
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
        formatter: (val: number) => `${val} ${adminT.value.rsvps.entries}`,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 250 },
          xaxis: {
            labels: { style: { fontSize: '10px' } },
          },
        },
      },
    ],
  }))

  const chartKey = computed(() => `partysize-${isDark.value}`)
</script>

<template>
  <div class="chart-container">
    <VueApexCharts
      :key="chartKey"
      type="bar"
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
