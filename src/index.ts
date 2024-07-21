import { Command } from 'commander';
import { version } from './version';

const program = new Command();
program.version(version);

program
  .command('clean [dir]')
  .description(
    'Clean up RAW files from a directory where no exported JPEGs exist'
  )
  .option(
    '-e, --export-dir-name <exportDir>',
    'Name of a subdirectory with exported JPEGs',
    'Export'
  )
  .action(
    async (
      dir: string,
      options: {
        exportDirName: string;
      }
    ) => {
      console.log('Cleaning up RAW files');
      console.log('Dir:', dir);
      console.log('Subdir name with exports:', options.exportDirName);
    }
  );

program.parse(process.argv);
