import { createLambdaPermission, fnSub } from '@sjmeverett/cfn-types';

/**
 * Options for `createApiGatewayLambdaPermission`
 */
export interface CreateApiGatewayLambdaPermissionOptions {
  /**
   * The ref of the API that is to be allowed to invoke the lambda
   */
  ApiId: string;
  /**
   * The ARN of the lambda to be invoked by ApiGateway
   */
  LambdaArn: string;
  /**
   * The API stage
   */
  Stage: string;
}

/**
 * Creates a lambda permission allowing the specified lambda to be invoked by ApiGateway
 * @param name the name for the role
 * @param options additional options
 */
export function createApiGatewayLambdaPermission(
  name: string,
  options: CreateApiGatewayLambdaPermissionOptions,
) {
  return createLambdaPermission(name, {
    Action: 'lambda:InvokeFunction',
    FunctionName: options.LambdaArn,
    Principal: 'apigateway.amazonaws.com',
    SourceArn: fnSub(
      'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/${Stage}/*/*',
      { ApiId: options.ApiId, Stage: options.Stage },
    ),
  });
}
