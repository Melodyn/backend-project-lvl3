import path from 'path';
import fs, { promises as fsp } from 'fs';

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

export const urlPathToFilename = (pathname) => {
  const { dir, name, ext } = path.parse(pathname);
  const processedName = urlToFilename(path.join(dir, name));
  return processedName + ext;
};

export const urlToName = (url, postfix = '') => {
  const { hostname, pathname } = url;
  const name = urlToFilename(path.join(hostname, pathname));
  return name + postfix;
};

// files

export const fileExists = (dirpath, filename) => fsp.readdir(dirpath)
  .then((filenames) => filenames.includes(filename));

export const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');

export const createFile = (dirpath, filename, content) => content
  .pipe(fs.createWriteStream(path.resolve(dirpath, filename), { encoding: 'utf-8' }));
