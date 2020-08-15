import path from 'path';
import { promises as fs } from 'fs';

// urls

export const urlToFilename = (name, replacer = '-') => name.match(/\w*/gi)
  .filter((x) => x)
  .join(replacer);

export const getDomain = ({ hostname }) => {
  const iter = (symbolCount, domain) => {
    if (symbolCount < 0) return domain;
    const currentSymbol = hostname[symbolCount];
    return (currentSymbol === '.' && domain.includes(currentSymbol))
      ? domain
      : iter(symbolCount - 1, currentSymbol + domain);
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

export const fileExists = (dirpath, filename) => fs.readdir(dirpath)
  .then((filenames) => filenames.includes(filename));

export const readFile = (dirpath, filename) => fs.readFile(path.join(dirpath, filename), 'utf-8');

export const createFile = (dirpath, filename, content) => content
  .pipe(fs.createWriteStream(path.resolve(dirpath, filename), { encoding: 'utf-8' }));
