import axios from 'axios';
import { urlToName, createFile } from './utils.js';

const pageLoader = (url, outputDirPath) => {
  const { filename, type } = urlToName(url, 'html');

  return axios.get(url.toString(), { responseType: 'stream' })
    .then(({ data }) => data)
    .then((data) => createFile(outputDirPath, `${filename}.${type}`, data));
};

// const pageLoader = (url, outputDirPath) => axios.get(url.toString(), { responseType: 'stream' })
//   .then(({ data }) => data)
//   .then((data) => createFile(outputDirPath, urlToName(url, '.html'), data));

export default pageLoader;
