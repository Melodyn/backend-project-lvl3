import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';

const getDomain = (hostname) => {
  const iter = (symbolCount, domain) => {
    const currentSymbol = hostname[symbolCount];
    return (currentSymbol === '.' && domain.includes(currentSymbol))
      ? domain
      : iter(symbolCount - 1, currentSymbol + domain);
  };
  return iter(hostname.length - 1, '');
};
const urlToName = (url, postfix) => {
  const { hostname, pathname } = new URL(url);
  const name = `${hostname}${pathname}`.match(/\w*/gi)
    .filter((x) => x)
    .join('-');
  return name + postfix;
};
const createFile = (dirpath, filename, content) => fs
  .writeFile(path.resolve(dirpath, filename), content);

const pageLoader = (url, outputDirPath) => axios.get(url)
  .then(({ data }) => data)
  .then((data) => createFile(outputDirPath, urlToName(url, '.html'), data));

export default pageLoader;
