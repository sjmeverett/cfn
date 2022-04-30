import {
  createCloudFormationCustomResource,
  getAttribute,
  Resource,
} from '@sjmeverett/cfn-types';
import { resolve } from 'path';
import { createLambdaWithRole } from './createLambdaWithRole';
import type { S3BucketWithContentsOptions } from '../custom/s3BucketWithContents';
import { packageVersion } from '../util/packageVersion';
import { createFileAsset } from '../util/createFileAsset';

/**
 * Options for `createS3BucketWithContents`
 */
export interface CreateS3BucketWithContentsOptions
  extends S3BucketWithContentsOptions {}

/**
 * Represents an S3 bucket with specified contents.
 */
export type S3BucketWithContentsDescription = Resource<
  'AWS::CloudFormation::CustomResource',
  unknown,
  { RegionalDomainName: string }
>;

const customResourceLambdaKey = `s3BucketWithContents-${packageVersion}.zip`;

const [customResourceLambda, customResourceLambdaRole] = createLambdaWithRole(
  'S3BucketWithContentsResource',
  {
    Code: {
      S3Bucket: { Ref: 'DeploymentBucket' } as any,
      S3Key: customResourceLambdaKey,
    },
    Handler: 'index.handler',
    Runtime: 'nodejs14.x',
    Timeout: 120,
    AllowLogging: true,
    Policies: [
      {
        PolicyName: 'S3BucketWithContentsResourceS3Policy',
        PolicyDocument: {
          Statement: [
            {
              Action: ['s3:*'],
              Effect: 'Allow',
              Sid: 'AddPerm',
              Resource: '*',
            },
          ],
        },
      },
    ],
  },
);

/**
 * The resources required by the custom resource for `createS3BucketWithContents` —
 * these should be created once per stack that uses the resource.
 */
export const s3BucketWithContentsCustomResource = [
  customResourceLambda,
  customResourceLambdaRole,
  createFileAsset(
    resolve(__dirname, '../dist/s3BucketWithContentsResource.zip'),
    customResourceLambdaKey,
  ),
];

/**
 * Creates an S3 bucket with specified contents in a zip, using a custom resource.
 * Don't forget to add `s3BucketWithContentsCustomResource` to your stack.
 * @param name
 * @param options
 * @returns
 */
export function createS3BucketWithContents(
  name: string,
  options: CreateS3BucketWithContentsOptions,
): S3BucketWithContentsDescription {
  return createCloudFormationCustomResource(name, {
    ...options,
    ServiceToken: getAttribute(customResourceLambda, 'Arn'),
  });
}
