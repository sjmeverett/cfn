import {
  LambdaFunctionProperties,
  createLambdaFunction,
  getAttribute,
  LambdaFunctionDescription,
  IAMRoleDescription,
} from '@sjmeverett/cfn-types';
import { createLambdaRole, CreateLambdaRoleOptions } from './createLambdaRole';

/**
 * Options for createLambdaWithRole
 */
export interface CreateLambdaWithRoleOptions
  extends CreateLambdaRoleOptions,
    Omit<LambdaFunctionProperties, 'Role'> {}

/**
 * Creates a lambda and a role for that lambda.
 * @param name the name to give the lambda
 * @param options additional options
 */
export function createLambdaWithRole(
  name: string,
  options: CreateLambdaWithRoleOptions,
): [LambdaFunctionDescription, IAMRoleDescription] {
  const { Policies, AllowLogging, ...lambdaOptions } = options;
  const role = createLambdaRole(name + 'Role', { Policies, AllowLogging });

  const lambda = createLambdaFunction(name, {
    ...lambdaOptions,
    Role: getAttribute(role, 'Arn'),
  });

  return [lambda, role];
}
