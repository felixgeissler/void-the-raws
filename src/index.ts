import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { unlink } from 'fs/promises';
import path from 'path';
import { exit } from 'process';
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
  .option('-tr, --type-raw <ext>', 'Extension of RAW files', 'ARW')
  .option('-te, --type-edited <ext>', 'Extension of edited files', 'jpg')
  .action(
    async (
      dir: string,
      options: {
        exportDirName: string;
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

      let rawFiles: string[] = [];
      try {
        rawFiles = await getFilesByExtension(rawDir, options.typeRaw);
      } catch (error) {
        console.error(`Could not read RAW directory: ${rawDir}.`);
        exit(1);
      }

      const rawsWithoutEdits = rawFiles.filter(
        rawFile =>
          !editedFiles.includes(
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

program.parse(process.argv);
