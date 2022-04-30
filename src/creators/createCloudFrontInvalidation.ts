import type { CloudFrontInvalidationOptions } from '../custom/cloudFrontInvalidation';
import {
  createCloudFormationCustomResource,
  getAttribute,
  Resource,
} from '@sjmeverett/cfn-types';
import { packageVersion } from '../util/packageVersion';
import { createLambdaWithRole } from './createLambdaWithRole';
import { resolve } from 'path';
import { createFileAsset } from '../util/createFileAsset';

/**
 * Options for `createCloudFrontInvalidation`
 */
export interface CreateCloudFrontInvalidationOptions
  extends CloudFrontInvalidationOptions {}

/**
 * Represents a CloudFront invalidation resource.
 */
export type CloudFrontInvalidationDescription = Resource<
  'AWS::CloudFormation::CustomResource',
  unknown,
  {}
>;

const customResourceLambdaKey = `cloudfrontInvalidation-${packageVersion}.zip`;

const [customResourceLambda, customResourceLambdaRole] = createLambdaWithRole(
  'CloudFrontInvalidation',
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
        PolicyName: 'CloudFrontInvalidationS3Policy',
        PolicyDocument: {
          Statement: [
            {
              Action: ['cloudfront:CreateInvalidation'],
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
 * The resources required by the custom resource for `createCloudFrontInvalidation` —
 * these should be created once per stack that uses the resource.
 */
export const cloudFrontInvalidationCustomResource = [
  customResourceLambda,
  customResourceLambdaRole,
  createFileAsset(
    resolve(__dirname, '../dist/cloudFrontInvalidation.zip'),
    customResourceLambdaKey,
  ),
];

/**
 * Creates a CloudFront invalidation
 * @param name the name to give the resource
 * @param options additional options
 */
export function createCloudFrontInvalidation(
  name: string,
  options: CreateCloudFrontInvalidationOptions,
): CloudFrontInvalidationDescription {
  return createCloudFormationCustomResource(name, {
    ...options,
    ServiceToken: getAttribute(customResourceLambda, 'Arn'),
  });
}
