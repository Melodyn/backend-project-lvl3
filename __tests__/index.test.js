import { promises as fsp } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import loader from '../index.js';

const pageLoader = (url, outputDirPath) => loader(url, outputDirPath, 'silent');

const buildFixturesPath = (...paths) => path.join('__fixtures__', ...paths);
const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');
const fileExists = (filepath) => {
  const dirname = path.dirname(filepath);
  const filename = path.basename(filepath);
  return fsp.readdir(dirname)
    .then((filenames) => filenames.includes(filename));
};

const pageDirname = 'hexlet-io-courses_files';
const pageFilename = 'hexlet-io-courses.html';
const baseUrl = 'https://hexlet.io';
const pagePath = '/courses';
const pageUrl = new URL(pagePath, baseUrl);

let tmpDirPath = '';
let expectedPageContent = '';
let resources = [
  {
    format: 'css',
    urlPath: '/assets/application-8c09cda7aec4e387f473cc08d778b2a7f8a1e9bfe968af0633e6ab8c2f38e03f.css',
    filename: path.join(
      pageDirname,
      'hexlet-io-assets-application-8c09cda7aec4e387f473cc08d778b2a7f8a1e9bfe968af0633e6ab8c2f38e03f.css',
    ),
  },
  {
    format: 'svg',
    urlPath: '/assets/professions/frontend-be958f979985faf47f82afea21e2d4f2ffb22b467f1c245d926dcb765b9ed953.svg',
    filename: path.join(
      pageDirname,
      'hexlet-io-assets-professions-frontend-be958f979985faf47f82afea21e2d4f2ffb22b467f1c245d926dcb765b9ed953.svg',
    ),
  },
  {
    format: 'js',
    urlPath: '/packs/js/runtime-64630796b8e08f0f1f1d.js',
    filename: path.join(
      pageDirname,
      'hexlet-io-packs-js-runtime-64630796b8e08f0f1f1d.js',
    ),
  },
  {
    format: 'html',
    urlPath: '/courses',
    filename: path.join(
      pageDirname,
      'hexlet-io-courses.html',
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
