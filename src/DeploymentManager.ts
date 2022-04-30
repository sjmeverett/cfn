import {
  Asset,
  getAssets,
  StackItem,
  getTemplate,
  createAsset,
} from '@sjmeverett/cfn-types';
import { CloudFormation, S3 } from 'aws-sdk';
import { upperFirst } from './util/upperFirst';

export interface DeploymentManagerOptions {
  /**
   * The AWS region to use for the stack and the deployment bucket
   */
  region?: string;
  /**
   * The name of the bucket to upload deployment assets to
   */
  deploymentBucket: string;
  /**
   * The name of the stack in CloudFormation
   */
  stackName: string;
  /**
   * The stage, e.g. dev or prod
   */
  stage: string;
  /**
   * The unique change ID, e.g. the git ref or version number
   */
  changeId: string;
  /**
   * The S3 instance to use
   */
  s3?: S3;
  /**
   * The CloudFormation instance to use
   */
  cloudFormation?: CloudFormation;
  /**
   * An optional progress function to update the UI with the task progress.
   */
  progress?: ProgressFunction;
}

export type ProgressFunction = (status: string, progress: number) => void;

/**
 * Manages uploading deployment assets and creating changesets.
 */
export class DeploymentManager {
  public readonly s3: S3;
  public readonly cloudFormation: CloudFormation;
  public readonly stackNameWithStage: string;
  private progress: ProgressFunction;

  constructor(private options: DeploymentManagerOptions) {
    this.s3 = options.s3 || new S3({ region: options.region });
    this.cloudFormation =
      options.cloudFormation || new CloudFormation({ region: options.region });
    this.progress = options.progress || (() => undefined);
    this.stackNameWithStage = options.stackName + upperFirst(options.stage);
  }

  /**
   * Uploads the CloudFormation template and any assets for the given stack to the deployment bucket.
   * @param stack the stack to upload
   */
  async uploadStack(stack: StackItem[]) {
    const assets = getAssets(stack);

    const template = createAsset(
      `cloudformation-${this.options.changeId}.json`,
      getTemplate(stack),
    );

    assets.push(template);
    await this.uploadAssets(assets);
  }

  /**
   * Uploads a collection of assets to the deployment bucket.
   * @param stack the stack, possibly containing assets to upload
   */
  async uploadAssets(stack: StackItem[]) {
    await Promise.all(getAssets(stack).map(this.uploadAsset.bind(this)));
  }

  /**
   * Uploads an asset to the deployment bucket.
   * @param asset the asset to upload
   */
  uploadAsset(asset: Asset) {
    const status = `Uploading ${asset.key}`;

    this.progress(status, 0);

    const result = this.s3.upload({
      Key: asset.key,
      Bucket: this.options.deploymentBucket,
      Body: asset.body,
    });

    result.on('httpUploadProgress', (progress) => {
      this.progress(status, progress.loaded / progress.total);
    });

    return result.promise();
  }

  /**
   * Tries to determine if the stack should be created or updated.
   * @returns UPDATE if the stack should be updated; otherwise, CREATE
   */
  async getChangeSetType() {
    const { StackSummaries } = await this.cloudFormation
      .listStacks({})
      .promise();

    const stack = StackSummaries?.find(
      (x) =>
        x.StackName === this.options.stackName &&
        !['REVIEW_IN_PROGRESS', 'DELETE_COMPLETE'].includes(x.StackStatus),
    );

    return stack ? 'UPDATE' : 'CREATE';
  }

  /**
   * Figures out whether the changeset is to be created or updated, and does that.
   */
  async createOrUpdateChangeSet() {
    this.progress('Creating changeset', 0);

    const { changeId, deploymentBucket, region = 'us-east-1' } = this.options;
    const changeSetName =
      this.stackNameWithStage + '-' + changeId.replace(/\./g, '-');
    const changeSetType = await this.getChangeSetType();

    this.progress('Creating changeset', 0.5);

    await this.cloudFormation
      .createChangeSet({
        StackName: this.stackNameWithStage,
        ChangeSetType: changeSetType,
        ChangeSetName: changeSetName,
        TemplateURL: `https://${deploymentBucket}.s3.${region}.amazonaws.com/cloudformation-${changeId}.json`,
        Capabilities: ['CAPABILITY_IAM'],
      })
      .promise();

    this.progress('Creating changeset', 1);
  }
}
