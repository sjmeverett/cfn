import {
  createApiGatewayBasePathMapping,
  createApiGatewayDeployment,
  createApiGatewayDomainName,
  createApiGatewayMethod,
  createApiGatewayResource,
  createApiGatewayRestApi,
  createApiGatewayStage,
  createRoute53RecordSet,
  dependsOn,
  fnSub,
  getAttribute,
  getRef,
} from '@sjmeverett/cfn-types';
import { upperFirst } from '../util/upperFirst';
import { createApiGatewayLambdaPermission } from './createApiGatewayLambdaPermission';
import {
  createLambdaWithRole,
  CreateLambdaWithRoleOptions,
} from './createLambdaWithRole';

/**
 * Options for `createLambdaApi`
 */
export interface CreateLambdaApiOptions extends CreateLambdaWithRoleOptions {
  /**
   * The API stage (e.g., dev)
   */
  Stage: string;
  /**
   * A description for the API
   */
  Description: string;
  /**
   * The name of the Route53 domain (usually the FQDN of the root domain, e.g. "example.com.")
   */
  HostedZoneName: string;
  /**
   * The domain name for the API
   */
  DomainName: string;
  /**
   * The ARN of the HTTPS certificate to use
   */
  CertificateArn: string;
  /**
   * Whether or not to enable API Gateway logging.
   */
  EnableLogging?: string;
}

/**
 * Creates an APIGateway API with a custom domain in Route53 that forwards all requests to a Lambda function.
 * @param name the name to give the resource
 * @param options additional options
 */
export function createLambdaApi(name: string, options: CreateLambdaApiOptions) {
  const {
    Stage,
    Description,
    HostedZoneName,
    DomainName,
    CertificateArn,
    ...lambdaOptions
  } = options;

  const [lambda, lambdaRole] = createLambdaWithRole(name, lambdaOptions);

  const invokeArn = fnSub(
    'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${Arn}/invocations',
    { Arn: getAttribute(lambda, 'Arn') },
  );

  // create the API Gateway Rest API
  const api = createApiGatewayRestApi(name + 'ApiGateway', {
    Name: name + upperFirst(Stage),
    Description,
  });

  // give API Gateway access to the lambda function
  const permission = createApiGatewayLambdaPermission(name + 'Permission', {
    ApiId: getRef(api),
    LambdaArn: getAttribute(lambda, 'Arn'),
    Stage,
  });

  // proxy all paths (except /, which is below)
  const wildcardProxyResource = createApiGatewayResource(
    name + 'WildcardProxy',
    {
      RestApiId: getRef(api),
      ParentId: getAttribute(api, 'RootResourceId'),
      PathPart: '{proxy+}',
    },
  );

  const wildcardProxyMethod = createApiGatewayMethod(
    name + 'WildcardProxyMethod',
    {
      RestApiId: getRef(api),
      ResourceId: getRef(wildcardProxyResource),
      HttpMethod: 'ANY',
      AuthorizationType: 'NONE',
      Integration: {
        Type: 'AWS_PROXY',
        IntegrationHttpMethod: 'POST',
        Uri: invokeArn,
      },
    },
  );

  // proxy root (/) path
  const rootProxyMethod = createApiGatewayMethod(name + 'RootProxyMethod', {
    RestApiId: getRef(api),
    ResourceId: getAttribute(api, 'RootResourceId'),
    HttpMethod: 'ANY',
    AuthorizationType: 'NONE',
    Integration: {
      Type: 'AWS_PROXY',
      IntegrationHttpMethod: 'POST',
      Uri: invokeArn,
    },
  });

  // create a deployment
  const apiGatewayDeployment = createApiGatewayDeployment(name + 'Deployment', {
    RestApiId: getRef(api),
  });

  dependsOn(apiGatewayDeployment, wildcardProxyMethod, rootProxyMethod);

  // create the stage to enable logging
  const stage = createApiGatewayStage(name + 'Stage', {
    RestApiId: getRef(api),
    DeploymentId: getRef(apiGatewayDeployment),
    StageName: Stage,
    MethodSettings: options.EnableLogging
      ? [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            ResourcePath: '/*',
            MetricsEnabled: true,
          },
        ]
      : undefined,
  });

  // create the domain name in API Gateway
  const apiGatewayDomain = createApiGatewayDomainName(name + 'Domain', {
    DomainName,
    CertificateArn: CertificateArn,
  });

  // create the base path mapping in the API Gateway domain
  const basePathMapping = createApiGatewayBasePathMapping(name + 'BasePath', {
    DomainName,
    Stage: Stage,
    RestApiId: getRef(api),
  });

  dependsOn(basePathMapping, apiGatewayDomain);

  // create the domain record in Route53
  const route53Record = createRoute53RecordSet(name + 'Route53Record', {
    Name: DomainName,
    Type: 'A',
    HostedZoneName,
    AliasTarget: {
      DNSName: getAttribute(apiGatewayDomain, 'DistributionDomainName'),
      HostedZoneId: getAttribute(apiGatewayDomain, 'DistributionHostedZoneId'),
      EvaluateTargetHealth: true,
    },
  });

  return [
    lambda,
    lambdaRole,
    api,
    permission,
    wildcardProxyResource,
    wildcardProxyMethod,
    rootProxyMethod,
    apiGatewayDeployment,
    stage,
    apiGatewayDomain,
    basePathMapping,
    route53Record,
  ];
}
