import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';

const baseUrl = 'https://hexlet.io';
const page = '/courses';
const expectedContent = 'Hello from hexlet.io courses!';
const expectedFilename = 'hexlet-io-courses.html';

let tmpDirPath = '';
const fileExists = (dirpath, filename) => fs.readdir(dirpath)
  .then((filenames) => filenames.includes(filename));
const readFile = (dirpath, filename) => fs.readFile(path.join(dirpath, filename), 'utf-8');

beforeAll(async () => {
  tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterAll(async () => {
  await fs.readdir(tmpDirPath)
    .then((filenames) => filenames.map((filename) => path.join(tmpDirPath, filename)))
    .then((paths) => Promise.all(paths.map((filepath) => fs.unlink(filepath))));
  await fs.rmdir(tmpDirPath);
});

test('tmp dir', async () => {
  const fileAlreadyExist = await fileExists(tmpDirPath, expectedFilename);
  expect(fileAlreadyExist).toBe(false);

  nock(baseUrl).get(page).reply(200, expectedContent);
  await pageLoader(baseUrl + page, tmpDirPath);

  const fileWasCreated = await fileExists(tmpDirPath, expectedFilename);
  expect(fileWasCreated).toBe(true);

  const actualContent = await readFile(tmpDirPath, expectedFilename);
  expect(actualContent).toBe(expectedContent);
});
