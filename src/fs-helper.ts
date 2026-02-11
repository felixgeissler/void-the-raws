import { readdir, stat } from 'node:fs/promises';
import path from 'path';

export const getFilesByExtension = async (
  directory: string,
  fileExtension: string
) => {
  const files = await readdir(directory);
  return (
    files
      .filter(
        file =>
          path.extname(file).toLowerCase() === `.${fileExtension.toLowerCase()}`
      )
      // assure shell safety
      .map(file => file.replace(/ /g, '\\ '))
  );
};

export const getFilesByPrefix = async (directory: string, prefix: string) => {
  const files = await readdir(directory);
  return files.filter(file => file.startsWith(prefix));
};

export const getSubdirectories = async (directory: string) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
};

export const getDirectorySize = async (directory: string): Promise<number> => {
  const entries = await readdir(directory, { withFileTypes: true });

  const sizes = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        return stats.size;
      }
      return 0;
    })
  );

  return sizes.reduce((total, size) => total + size, 0);
};
