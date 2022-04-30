import { createIAMRole, IAMRolePolicy } from '@sjmeverett/cfn-types';

/**
 * Options for `createECSTaskRole`
 */
export interface CreateECSTaskRoleOptions {
  /**
   * Any additional policies to attach to the role.
   */
  Policies?: IAMRolePolicy[];
}

/**
 * Creates an ECS task role.
 * @param name the name to give the role
 * @param options any additional options
 */
export function createECSTaskRole(
  name: string,
  options: CreateECSTaskRoleOptions,
) {
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
    Policies: options.Policies || [],
  });
}
