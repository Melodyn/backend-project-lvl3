import pageLoader from './src/index.js';

export default (
  url,
  outputDirPath = process.cwd(),
  progressBar = 'default',
) => pageLoader(new URL(url), outputDirPath, progressBar);
