import { createIAMRole, IAMRolePolicy } from '@sjmeverett/cfn-types';
import { createLogPolicy } from './createLogPolicy';

/**
 * Options for createLambdaRole
 */
export interface CreateLambdaRoleOptions {
  /**
   * Policies to attach to the role.
   */
  Policies?: IAMRolePolicy[];
  /**
   * Whether or not to generate and attach a policy for CloudWatch.
   */
  AllowLogging?: boolean;
}

/**
 * Creates a role for a lambda function.
 * @param name the name to give the role
 * @param options additional options for the role
 */
export function createLambdaRole(
  name: string,
  options: CreateLambdaRoleOptions,
) {
  const Policies = options.Policies || [];

  if (options.AllowLogging) {
    Policies.push(createLogPolicy(name + 'LogPolicy'));
  }

  return createIAMRole(name, {
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
          Sid: '',
        },
      ],
    },
    Policies,
  });
}
