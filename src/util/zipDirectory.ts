import archiver from 'archiver';
import { createWriteStream } from 'fs';

/**
 * Zips up a directory.
 * @param src the directory to create the zip from
 * @param outputPath the path of the zip to output
 */
export function zipDirectory(src: string, outputPath: string) {
  const outstream = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.directory(src, false);
  archive.pipe(outstream);
  archive.finalize();

  return new Promise((resolve, reject) => {
    archive.on('done', resolve);
    archive.on('error', reject);
  });
}
