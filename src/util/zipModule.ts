import { getPackagePaths } from '@sjmeverett/get-package-paths';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

/**
 * Zips up a node script with npm dependencies.
 * @param entryPoint the script to add to the zip
 * @param outputPath the path of the zip to output
 * @param includedPackages the packages to include in the zip
 */
export function zipModule(
  entryPoint: string,
  outputPath: string,
  includedPackages: string[],
) {
  const outstream = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  const packagePaths = getPackagePaths(process.cwd(), includedPackages);

  archive.file(entryPoint, { name: 'index.js' });

  packagePaths.forEach((pkg) => {
    archive.directory(pkg.path, `node_modules/${pkg.name}`);
  });

  archive.pipe(outstream);
  archive.finalize();

  return new Promise((resolve, reject) => {
    archive.on('done', resolve);
    archive.on('error', reject);
  });
}
