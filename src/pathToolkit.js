import path from 'path';

export const formatName = (name, replacer = '-') => name.match(/\w*/gi)
  .filter((x) => x)
  .join(replacer);

export const getDomain = ({ hostname }) => {
  const iter = (symbolCount, domain) => {
    if (symbolCount < 0) return domain;
    const currentSymbol = hostname[symbolCount];
    return (currentSymbol === '.' && domain.includes(currentSymbol))
      ? domain
      : iter(symbolCount - 1, currentSymbol + domain);
  };
  return iter(hostname.length - 1, '');
};

export const urlPathToFilename = (pathname) => {
  const { dir, name, ext } = path.parse(pathname);
  const processedName = formatName(path.join(dir, name));
  return processedName + ext;
};

export const urlToName = (url, postfix = '') => {
  const { hostname, pathname } = url;
  const name = formatName(path.join(hostname, pathname));
  return name + postfix;
};
