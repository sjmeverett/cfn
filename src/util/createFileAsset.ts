import { Asset, createAsset } from '@sjmeverett/cfn-types';
import { createReadStream } from 'fs';
import { basename } from 'path';

/**
 * Creates an asset from a file path.
 * @param path the path to create the asset from
 * @param key the key on S3 that the file is to be uploaded to; defaults to the basename of path
 * @returns the asset object
 */
export function createFileAsset(path: string, key?: string): Asset {
  return createAsset(key || basename(path), () => createReadStream(path));
}
