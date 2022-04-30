import { zipModule } from '../util/zipModule';

Promise.all([
  zipModule('dist/s3BucketWithContents.js', 'dist/s3BucketWithContents.zip', [
    'unzipper',
  ]),
  zipModule(
    'dist/cloudFrontInvalidation.js',
    'dist/cloudFrontInvalidation.zip',
    [],
  ),
])
  .then(() => {
    console.log('Done');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
