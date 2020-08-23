import path from 'path';
import { promises as fsp } from 'fs';

// urls

export const urlToFilename = (name, replacer = '-') => name.match(/\w*/gi)
  .filter((x) => x)
  .join(replacer);

export const getDomain = ({ hostname }) => {
  const iter = (symbolCount, domainAcc) => {
    if (symbolCount < 0) return domainAcc;
    const currentSymbol = hostname[symbolCount];
    const isSubDomain = ((currentSymbol === '.') && domainAcc.includes(currentSymbol));
    return isSubDomain
      ? domainAcc
      : iter(symbolCount - 1, currentSymbol + domainAcc);
  };
  return iter(hostname.length - 1, '');
};

export const urlToName = (link) => {
  const { dir, name, ext } = path.parse(link);
  const filename = urlToFilename(path.join(dir, name));
  const type = ext.slice(1);
  return { filename, type };
};

// files

export const fileExists = (filepath) => {
  const dirname = path.dirname(filepath);
  const filename = path.basename(filepath);
  return fsp.readdir(dirname)
    .then((filenames) => filenames.includes(filename));
};

export const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');

export const createFile = (dirpath, filename, content) => fsp
  .writeFile(path.resolve(dirpath, filename), content, { encoding: 'utf-8' });

export const createDir = (...paths) => {
  const dirpath = path.join(...paths);
  return fsp.mkdir(dirpath).then(() => dirpath);
};
