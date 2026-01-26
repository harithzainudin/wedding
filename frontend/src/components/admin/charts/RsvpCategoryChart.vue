<script setup lang="ts">
  import { computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import type { ApexOptions } from 'apexcharts'
  import type { RsvpAnalytics } from '@/types/rsvp'
  import { useDarkMode } from '@/composables/useDarkMode'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    byCategory: RsvpAnalytics['byCategory']
  }>()

  const { isDark } = useDarkMode()
  const { adminT } = useAdminLanguage()

  const categoryLabels = computed(() => ({
    father_guest: adminT.value.rsvps.fatherGuests,
    mother_guest: adminT.value.rsvps.motherGuests,
    both_parents_guest: adminT.value.rsvps.bothParentsGuests,
    father_relative: adminT.value.rsvps.fatherFamily,
    mother_relative: adminT.value.rsvps.motherFamily,
    couple_friend: adminT.value.rsvps.couplesFriends,
    couple_colleague: adminT.value.rsvps.couplesColleagues,
    spouse_family: adminT.value.rsvps.spouseSide,
    mutual_friend: adminT.value.rsvps.mutualFriends,
    other: adminT.value.rsvps.otherGuests,
    unknown: adminT.value.rsvps.notSpecified,
  }))

  const chartData = computed(() => {
    const categories = Object.keys(props.byCategory) as (keyof typeof props.byCategory)[]
    // Filter out categories with 0 guests and sort by guests count descending
    const filtered = categories
      .filter((key) => props.byCategory[key].guests > 0)
      .sort((a, b) => props.byCategory[b].guests - props.byCategory[a].guests)

    return {
      categories: filtered.map((key) => categoryLabels.value[key]),
      guests: filtered.map((key) => props.byCategory[key].guests),
      entries: filtered.map((key) => props.byCategory[key].entries),
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
        barHeight: '70%',
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    colors: ['#8b5cf6'], // purple-500
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
          chart: { height: 300 },
          yaxis: {
            labels: { style: { fontSize: '10px' } },
          },
        },
      },
    ],
  }))

  const chartKey = computed(() => `category-${isDark.value}`)
</script>

<template>
  <div class="chart-container">
    <VueApexCharts
      v-if="chartData.guests.length > 0"
      :key="chartKey"
      type="bar"
      height="280"
      :options="chartOptions"
      :series="series"
    />
    <div
      v-else
      class="flex items-center justify-center h-64 text-charcoal-light dark:text-dark-text-secondary"
    >
      {{ adminT.rsvps.notSpecified }}
    </div>
  </div>
</template>

<style scoped>
  .chart-container {
    width: 100%;
    min-height: 200px;
  }
</style>
