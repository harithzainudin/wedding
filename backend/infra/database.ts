export const table = new sst.aws.Dynamo('AppDataTable', {
  fields: {
    pk: 'string',
    sk: 'string',
    gsi1pk: 'string',
    gsi1sk: 'string',
    gsi2pk: 'string',
    gsi2sk: 'string',
  },
  primaryIndex: {
    hashKey: 'pk',
    rangeKey: 'sk',
  },
  globalIndexes: {
    byStatus: {
      hashKey: 'gsi1pk',
      rangeKey: 'gsi1sk',
    },
    // GSI2: For wedding slug lookup (slug -> weddingId)
    bySlug: {
      hashKey: 'gsi2pk',
      rangeKey: 'gsi2sk',
    },
  },
})
