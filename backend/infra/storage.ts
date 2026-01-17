export const imageBucket = new sst.aws.Bucket('WeddingImageBucket', {
  cors: {
    allowHeaders: ['*'],
    allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
    allowOrigins: ['http://localhost:5173', 'https://harithzainudin.github.io'],
    exposeHeaders: ['ETag'],
    maxAge: '3600 seconds',
  },
  access: 'public',
})
