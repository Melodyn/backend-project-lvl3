import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import { urlToName } from './pathToolkit.js';

const createFile = (dirpath, filename, content) => fs
  .writeFile(path.resolve(dirpath, filename), content);

const pageLoader = (url, outputDirPath) => axios.get(url)
  .then(({ data }) => data)
  .then((data) => createFile(outputDirPath, urlToName(new URL(url), '.html'), data));

export default pageLoader;
