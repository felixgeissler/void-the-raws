import { exec } from 'node:child_process';
import util from 'node:util';

export const getMp4Codec = async (filePath: string): Promise<string> => {
  const execPromise = util.promisify(exec);
  const { stdout } = await execPromise(
    `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 ${filePath}`
  );
  return stdout.trim();
};

export const reencodeMp4ToH265 = async (filePath: string) => {
  console.log(`Starting reencoding of ${filePath}...`);
  const execPromise = util.promisify(exec);
  const { stdout, stderr } = await execPromise(
    `ffmpeg -i ${filePath} -c:v libx265 -crf 24 -preset slow -c:a aac -b:a 128k -tag:v hvc1 -map_metadata 0 -movflags use_metadata_tags ${filePath.replace(
      '.mp4',
      '_h265.mp4'
    )}`
  );

  console.log(`Reencoding of ${filePath} done.`);
};
