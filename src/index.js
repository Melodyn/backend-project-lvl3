import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { urlToName } from './pathToolkit.js';

const createFile = (dirpath, filename, content) => content
  .pipe(fs.createWriteStream(path.resolve(dirpath, filename), { encoding: 'utf-8' }));

const pageLoader = (url, outputDirPath) => axios.get(url.toString(), { responseType: 'stream' })
  .then(({ data }) => data)
  .then((data) => createFile(outputDirPath, urlToName(url, '.html'), data));

export default pageLoader;
