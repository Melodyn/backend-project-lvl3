import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';

const urlToFilename = (url, format = 'html') => {
  const { hostname, pathname } = new URL(url);
  const name = `${hostname}${pathname}`.match(/\w*/gi)
    .filter((x) => x)
    .join('-');
  return `${name}.${format}`;
};
const createFile = (dirpath, filename, content) => fs
  .writeFile(path.resolve(dirpath, filename), content);

const pageLoader = (url, outputDirPath) => axios.get(url)
  .then(({ data }) => data)
  .then((data) => createFile(outputDirPath, urlToFilename(url), data));

export default pageLoader;
