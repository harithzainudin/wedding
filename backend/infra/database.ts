export const table = new sst.aws.Dynamo("RsvpTable", {
  fields: {
    pk: "string",
    sk: "string",
    gsi1pk: "string",
    gsi1sk: "string",
  },
  primaryIndex: {
    hashKey: "pk",
    rangeKey: "sk",
  },
  globalIndexes: {
    byStatus: {
      hashKey: "gsi1pk",
      rangeKey: "gsi1sk",
    },
  },
});
