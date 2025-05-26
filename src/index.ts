import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { ExifDateTime, exiftool } from 'exiftool-vendored';
import { unlink } from 'fs/promises';
import path from 'path';
import { exit } from 'process';
import { getMp4Codec, reencodeMp4ToH265 } from './ffmpeg-helper';
import { getFilesByExtension, getFilesByPrefix } from './fs-helper';
import { version } from './version';

const program = new Command();
program.version(version);

program
  .command('clean')
  .argument('dir', 'Directory to clean up')
  .description(
    'Clean up RAW files from a directory where no exported JPEGs exist'
  )
  .option(
    '-e, --export-dir-name <name>',
    'Name of a subdirectory with exported JPEGs',
    'Export'
  )
  .option(
    '-dp, --export-date-prefix',
    'Whether or not the exports are prefixed with a date (e.g. YYYYMMDD-raw_filename.jpg)'
  )
  .option('-tr, --type-raw <ext>', 'Extension of RAW files', 'ARW')
  .option('-te, --type-edited <ext>', 'Extension of edited files', 'jpg')
  .action(
    async (
      dir: string,
      options: {
        exportDirName: string;
        exportDatePrefix?: boolean;
        typeRaw: string;
        typeEdited: string;
      }
    ) => {
      const rawDir = path.normalize(dir);
      const exportDir = path.join(rawDir, options.exportDirName);

      // check for ._ files
      const rawDirDotFiles = await getFilesByPrefix(rawDir, '._');
      if (rawDirDotFiles.length > 0) {
        console.error(
          `There are ${rawDirDotFiles.length} ._ files in the RAW directory. Please remove them before running this command.`
        );
        exit(1);
      }
      const exportDirDotFiles = await getFilesByPrefix(exportDir, '._');
      if (exportDirDotFiles.length > 0) {
        console.error(
          `There are ${exportDirDotFiles.length} ._ files in the export directory. Please remove them before running this command.`
        );
        exit(1);
      }

      let editedFiles: string[] = [];
      try {
        editedFiles = await getFilesByExtension(exportDir, options.typeEdited);
      } catch (error) {
        console.error(
          `Could not read export directory: ${exportDir}. Make sure it exists or consider using the --export-dir-name <name> option.`
        );
        exit(1);
      }
      // check that the edited files are named correctly (YYYYMMDD-raw_filename.jpg)
      if (options.exportDatePrefix) {
        const datePattern = /^\d{8}-/; // e.g. 20210814-
        const invalidFiles = editedFiles.filter(
          editedFile => !datePattern.test(editedFile)
        );
        if (invalidFiles.length > 0) {
          console.error(
            `There are ${invalidFiles.length} files in the export directory that do not have the expected date prefix. Check the files and try with the --export-date-prefix option again.`
          );
          exit(1);
        }
      }

      let rawFiles: string[] = [];
      try {
        rawFiles = await getFilesByExtension(rawDir, options.typeRaw);
      } catch (error) {
        console.error(`Could not read RAW directory: ${rawDir}.`);
        exit(1);
      }

      const compareFiles = options.exportDatePrefix
        ? editedFiles.map(editedFile => editedFile.replace(/^\d{8}-/, ''))
        : editedFiles;
      const rawsWithoutEdits = rawFiles.filter(
        rawFile =>
          !compareFiles.includes(
            rawFile.replace(options.typeRaw, options.typeEdited)
          )
      );

      console.log(`${rawFiles.length} raw files (*.${options.typeRaw})`);
      console.log(
        `${editedFiles.length} edited files (*.${options.typeEdited})`
      );
      console.log(`=> ${rawsWithoutEdits.length} raw files with no edits`);
      console.log(``);

      if (rawsWithoutEdits.length === 0) {
        console.log('Nothing to clean up.');
        exit(0);
      }

      const showPreview = await confirm({
        message: `Do you want to see a preview of which files will be deleted?`,
        default: false,
      });
      if (showPreview) {
        for (const rawFile of rawFiles) {
          const willBeDeleted = rawsWithoutEdits.includes(rawFile);
          console.log(`${willBeDeleted ? '❌' : '  '} ${rawFile}`);
        }
        console.log(``);
      }

      const isDeleteConfirmed = await confirm({
        message: `Do you want to delete ${rawsWithoutEdits.length} files (${(rawsWithoutEdits.length / rawFiles.length) * 100}%) and keep ${rawFiles.length - rawsWithoutEdits.length}?`,
        default: false,
      });
      if (!isDeleteConfirmed) {
        console.log('Aborting...');
        exit(0);
      }
      // delete files
      console.log('Deleting files...');
      for (const rawFileWithoutEdit of rawsWithoutEdits) {
        const filePath = path.join(rawDir, rawFileWithoutEdit);
        await unlink(filePath);
        console.log(`Deleted ${filePath}`);
      }

      console.log('');
      console.log('Done!');
    }
  );

program
  .command('encode')
  .argument('dir', 'Directory to check for MP4 files')
  .description(
    'Check MP4 files in a directory for H.264 codec and reencode them to H.265'
  )
  .option(
    '-c, --concurrency <number>',
    'Number of files to reencode concurrently (ffmpeg jobs)',
    '2'
  )
  .action(
    async (
      dir: string,
      options: {
        concurrency: string;
      }
    ) => {
      const reencodeConcurrencyLimit = parseInt(options.concurrency, 10);
      if (reencodeConcurrencyLimit < 1) {
        console.error(`Invalid concurrency limit: ${options.concurrency}`);
        exit(1);
      }

      const videoDir = path.normalize(dir);
      const mp4Files = await getFilesByExtension(videoDir, 'mp4');

      const mp4FilesToReencode: string[] = [];
      for (const mp4File of mp4Files) {
        const codec = await getMp4Codec(path.join(videoDir, mp4File));
        if (codec === 'h264') {
          mp4FilesToReencode.push(mp4File);
        }
      }

      if (mp4FilesToReencode.length === 0) {
        console.log('No MP4 files using H.264 codec found.');
        console.log('');
        console.log('Done!');
        return;
      }

      console.log(
        `There are ${mp4FilesToReencode.length} MP4 files using H.264 codec that can be reencoded to save disk space.`
      );
      const reencodeMp4 = await confirm({
        message: `Do you want to reencode the MP4 files using H.265?`,
        default: false,
      });
      if (!reencodeMp4) {
        console.log('');
        console.log('Nothing to do.');
        return;
      }

      console.log('Reencoding MP4 files...');
      for (
        let i = 0;
        i < mp4FilesToReencode.length;
        i += reencodeConcurrencyLimit
      ) {
        const batch = mp4FilesToReencode.slice(i, i + reencodeConcurrencyLimit);
        await Promise.all(
          batch.map(mp4File => {
            const filePath = path.join(videoDir, mp4File);
            return reencodeMp4ToH265(filePath);
          })
        );
      }
    }
  );

program
  .command('fix-gps-metadata')
  .argument('dir', 'Directory to check for GPS metadata in JPEG files')
  .description(
    "Restores missing GPS timestamps by converting the photo's original creation time to UTC and writing it as GPSDateStamp and GPSTimeStamp for accurate timezone handling. Fixes the issue where Lightroom won't write GPSDateStamp and GPSTimeStamp on manually geotagged photos, which can lead to timezone shifts when importing JPEGs into Google Photos."
  )
  .option(
    '-e, --export-dir-name <name>',
    'Name of a subdirectory with exported JPEGs',
    'Export'
  )
  .option('-v, --verbose', 'Enable verbose output / debug mode', false)
  .option('-te, --type-edited <ext>', 'Extension of edited files', 'jpg')
  .action(
    async (
      dir: string,
      options: {
        verbose: boolean;
        exportDirName: string;
      }
    ) => {
      const updateGpsFromCreationDate = async (filePath: string) => {
        const metadata = await exiftool.read(filePath);
        const dateTimeOriginal = metadata.DateTimeOriginal;

        if (!(dateTimeOriginal instanceof ExifDateTime)) {
          console.warn(
            `⚠️  DateTimeOriginal is not a valid ExifDateTime in ${filePath}`
          );
          return false;
        }

        const hasGpsTime = metadata.GPSTimeStamp || metadata.GPSDateStamp;
        if (hasGpsTime) {
          if (options.verbose) {
            console.log(
              `↩ Skipping file - already has GPS timestamp: ${path.basename(filePath)}`
            );
          }
          return false;
        }

        let utcISOString = dateTimeOriginal.toISOString(); // this is not in UTC yet!
        if (!utcISOString) {
          console.warn(
            `⚠️  Could not convert DateTimeOriginal to ISO string in ${filePath}`
          );
          return false;
        }
        utcISOString = new Date(utcISOString).toISOString(); // convert to UTC
        const [datePart, timePart] = utcISOString.split('T');
        const gpsDateStamp = datePart.replace(/-/g, ':');
        const timeWithoutMs = timePart.split('.')[0];
        if (timeWithoutMs.length !== 8) {
          console.warn(
            `⚠️  Time part is not in the expected format (HH:mm:ss) in ${filePath}`
          );
          return false;
        }

        let shouldWrite = true;
        if (options.verbose) {
          console.log(`📸 ${path.basename(filePath)}`);
          console.log(`→ DateTimeOriginal: ${dateTimeOriginal}`);
          console.log(`→ GPSDateStamp:     ${gpsDateStamp}`);
          console.log(`→ GPSTimeStamp:     ${timeWithoutMs}`);

          shouldWrite = await confirm({
            message: 'Write GPS timestamp to this file?',
            default: true,
          });
        }

        if (!shouldWrite) {
          console.log('⏭️ Skipped.\n');
          return false;
        }

        await exiftool.write(filePath, {
          GPSDateStamp: gpsDateStamp,
          GPSTimeStamp: timeWithoutMs,
        });
        console.log(`🔧 Fixed GPS metadata for ${path.basename(filePath)}`);
        const tmpFilePath = filePath + '_original';
        await unlink(tmpFilePath);
        return true;
      };

      const rawDir = path.normalize(dir);
      const exportDir = path.join(rawDir, options.exportDirName);

      let editedFiles: string[] = [];
      try {
        editedFiles = await getFilesByExtension(exportDir, 'jpg');
      } catch (error) {
        console.error(
          `Could not read export directory: ${exportDir}. Make sure it exists or consider using the --export-dir-name <name> option.`
        );
        exit(1);
      }

      if (editedFiles.length === 0) {
        console.log('No  files found.');
        exit(0);
      }

      let fixedFilesCount = 0;
      for (const file of editedFiles) {
        const fullPath = path.join(exportDir, file);
        try {
          const wasFixed = await updateGpsFromCreationDate(fullPath);
          if (wasFixed) fixedFilesCount++;
        } catch (err) {
          console.error(`❌ Error with ${file}:`, err);
        }
      }
      console.log(
        fixedFilesCount
          ? `\n✅ Fixed GPS metadata in ${fixedFilesCount} files from ${editedFiles.length} total files.`
          : '\nNo files were fixed. All files already had GPS metadata.'
      );
      await exiftool.end();
    }
  );

program.parse(process.argv);
