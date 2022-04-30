import { createIAMRole } from '@sjmeverett/cfn-types';

/**
 * Creates an execution role for a Fargate task
 * @param name the name to give the role
 */
export function createFargateExecutionRole(name: string) {
  return createIAMRole(name, {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    },
    Policies: [
      {
        PolicyName: `${name}ExecutionPolicy`,
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        },
      },
    ],
  });
}
