# @sjmeverett/cfn

Deploy with CloudFormation from the comfort of TypeScript!

## Overview

This package extends [`@sjmeverett/cfn-types`](https://npmjs.org/package/@sjmeverett/cfn-types) to add helper functions for common scenarios, and a utility class to help with creating the changeset.

## Example

```ts
import {
  createS3StaticWebsite,
  createFileAsset,
  DeploymentManager,
} from '@sjmeverett/cfn';

const deploymentBucket = 'my-deployment-bucket';

const websiteZip = createFileAsset('./dist/website.zip');

const website = createS3StaticWebsite({
  SourceBucket: deploymentBucket,
  SourceKey: websiteZip.key,
  HostedZoneName: 'example.com',
  DomainName: 'test.example.com',
  IndexDocument: 'index.html',
  ErrorDocument: 'error.html',
  CertificateArn: 'arn:...',
});

const deployment = new DeploymentManager({
  deploymentBucket,
  stackName: 'MyWebsite',
  stage: 'dev',
  changeId: 'v1',
});

await deployment.uploadStack([...website, websiteZip]);

await deployment.createOrUpdateChangeSet();
```
