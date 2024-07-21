import { readdir } from 'node:fs/promises';
import path from 'path';

export const getFilesByExtension = async (
  directory: string,
  fileExtension: string
) => {
  const files = await readdir(directory);
  return files.filter(file => path.extname(file) === `.${fileExtension}`);
};

export const getFilesByPrefix = async (directory: string, prefix: string) => {
  const files = await readdir(directory);
  return files.filter(file => file.startsWith(prefix));
};
