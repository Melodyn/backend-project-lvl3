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

export const urlToName = (url, defaultType = '') => {
  const { hostname, pathname } = url;
  const { dir, name, ext } = path.parse(pathname);
  const type = ext ? ext.slice(1) : defaultType;
  const filename = urlToFilename(path.join(hostname, dir, name));
  return { filename, type };
};

// files

export const fileExists = (dirpath, filename) => fsp.readdir(dirpath)
  .then((filenames) => filenames.includes(filename));

export const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');

export const createFile = (dirpath, filename, content) => content
  .pipe(fs.createWriteStream(path.resolve(dirpath, filename), { encoding: 'utf-8' }));
