import * as utils from '../src/utils.js';

const postfix = '_files';

const cases = [
  [
    'http://hexlet.io/',
    '/courses/',
    'hexlet.io',
    'hexlet-io',
    'courses',
  ],
  [
    'https://ru.hexlet.io/courses',
    '/courses/assets/application.css',
    'hexlet.io',
    'ru-hexlet-io-courses',
    'courses-assets-application-css',
  ],
];

test.each(cases)('%s %s', (link, path, expectedDomain, expectedName, expectedFilename) => {
  const url = new URL(link);
  const { filename: actualName } = utils.urlToName(url);
  const { filename, type } = utils.urlToName(url, postfix);
  const actualNameWithPostfix = filename + type;
  const actualDomain = utils.getDomain(url);
  const actualFilename = utils.urlToFilename(path);

  expect(actualName).toEqual(expectedName);
  expect(actualNameWithPostfix).toEqual(expectedName + postfix);
  expect(actualDomain).toEqual(expectedDomain);
  expect(actualFilename).toEqual(expectedFilename);
});
