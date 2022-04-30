import { IAMRolePolicy } from '@sjmeverett/cfn-types';

/**
 * Creates an IAM policy for writing to CloudWatch
 * @param name the name to give the policy
 */
export function createLogPolicy(name: string): IAMRolePolicy {
  return {
    PolicyName: name,
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: 'arn:aws:logs:*:*:*',
          Effect: 'Allow',
        },
      ],
    },
  };
}
