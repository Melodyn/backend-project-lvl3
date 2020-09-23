import pageLoader from './src/index.js';

export default (
  url,
  outputDirPath = process.cwd(),
  progressBar = 'silent',
) => pageLoader(new URL(url), outputDirPath, progressBar);
