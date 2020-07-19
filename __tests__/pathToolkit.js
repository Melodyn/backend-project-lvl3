import * as pathToolkit from '../src/pathToolkit.js';

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
    'courses-assets-application.css',
  ],
];

test.each(cases)('%s%s', (link, path, expectedDomain, expectedName, expectedFilename) => {
  const url = new URL(link);
  const actualName = pathToolkit.urlToName(url);
  const actualNameWithPostfix = pathToolkit.urlToName(url, postfix);
  const actualDomain = pathToolkit.getDomain(url);
  const actualFilename = pathToolkit.urlPathToFilename(path);

  expect(actualName).toEqual(expectedName);
  expect(actualNameWithPostfix).toEqual(expectedName + postfix);
  expect(actualDomain).toEqual(expectedDomain);
  expect(actualFilename).toEqual(expectedFilename);
});
