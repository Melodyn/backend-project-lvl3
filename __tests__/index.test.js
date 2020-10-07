import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildFixturesPath = (...paths) => path.join(__dirname, '..', '__fixtures__', ...paths);
const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');
const fileExists = (filepath) => {
  const dirname = path.dirname(filepath);
  const filename = path.basename(filepath);
  return fsp.readdir(dirname)
    .then((filenames) => filenames.includes(filename));
};

const pageDirname = 'ru-hexlet-io-courses_files';
const pageFilename = 'ru-hexlet-io-courses.html';
const baseUrl = 'https://ru.hexlet.io';
const pagePath = '/courses';
const pageUrl = new URL(pagePath, baseUrl);

let tmpDirPath = '';
let expectedPageContent = '';
let resources = [
  {
    format: 'css',
    urlPath: '/assets/application.css',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-assets-application.css',
    ),
  },
  {
    format: 'svg',
    urlPath: '/assets/professions/nodejs.png',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-assets-professions-nodejs.png',
    ),
  },
  {
    format: 'js',
    urlPath: '/packs/js/runtime.js',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-packs-js-runtime.js',
    ),
  },
  {
    format: 'html',
    urlPath: '/courses',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-courses.html',
    ),
  },
];

const formats = resources.map(({ format }) => format);
const scope = nock(baseUrl).persist();

nock.disableNetConnect();

beforeAll(async () => {
  tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  const sourcePageContent = await readFile(buildFixturesPath('.'), pageFilename);
  const promises = resources.map((info) => readFile(buildFixturesPath('expected'), info.filename)
    .then((data) => ({ ...info, data })));

  expectedPageContent = await readFile(buildFixturesPath('expected'), pageFilename);
  resources = await Promise.all(promises);

  scope.get(pagePath).reply(200, sourcePageContent);
  resources.forEach(({ urlPath, data }) => scope.get(urlPath).reply(200, data));
});

describe('negative cases', () => {
  test('load page: no response', async () => {
    const fileAlreadyExist = await fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileAlreadyExist).toBe(false);

    const invalidBaseUrl = baseUrl.replace('x', '');
    const expectedError = `getaddrinfo ENOTFOUND ${invalidBaseUrl}`;
    nock(invalidBaseUrl).persist().get('/').replyWithError(expectedError);
    await expect(pageLoader(invalidBaseUrl, tmpDirPath))
      .rejects.toThrow(expectedError);

    const fileWasCreated = await fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileWasCreated).toBe(false);
  });

  test.each([404, 500])('load page: status code %s', async (code) => {
    scope.get(`/${code}`).reply(code, '');
    await expect(pageLoader(new URL(`/${code}`, baseUrl).toString(), tmpDirPath))
      .rejects.toThrow(`Request failed with status code ${code}`);
  });

  test('load page: file system errors', async () => {
    const rootDirPath = '/sys';
    await expect(pageLoader(pageUrl.toString(), rootDirPath))
      .rejects.toThrow(`EACCES: permission denied, mkdir '${rootDirPath}/${pageDirname}'`);

    const filepath = buildFixturesPath(pageFilename);
    await expect(pageLoader(pageUrl.toString(), filepath))
      .rejects.toThrow(`ENOTDIR: not a directory, mkdir '${filepath}/${pageDirname}'`);

    const notExistsPath = buildFixturesPath('notExistsPath');
    await expect(pageLoader(pageUrl.toString(), notExistsPath))
      .rejects.toThrow(`ENOENT: no such file or directory, mkdir '${notExistsPath}/${pageDirname}'`);
  });
});

describe('positive cases', () => {
  test('load page', async () => {
    const fileAlreadyExist = await fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileAlreadyExist).toBe(false);

    await pageLoader(pageUrl.toString(), tmpDirPath);

    const fileWasCreated = await fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileWasCreated).toBe(true);

    const actualContent = await readFile(tmpDirPath, pageFilename);
    expect(actualContent).toBe(expectedPageContent.trim());
  });

  test.each(formats)('check .%s-resource', async (format) => {
    const { filename, data } = resources.find((content) => content.format === format);

    const fileWasCreated = await fileExists(path.join(tmpDirPath, filename));
    expect(fileWasCreated).toBe(true);

    const actualContent = await readFile(tmpDirPath, filename);
    expect(actualContent).toBe(data);
  });
});
