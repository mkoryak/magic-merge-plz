'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _needle = require('needle');

var _needle2 = _interopRequireDefault(_needle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// DATA ////////////////////////////////////////////////////////////////////////

const ARTICLE_NAMESPACE = 0;
const TRANSLATE_API_URL = 'https://translate.googleapis.com/translate_a/single';
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const MANGLE_LANG_1 = 'de';
const MANGLE_LANG_2 = 'tr';
const TARGET_LANG = 'en';
const ELISION_PATTERN = /,+/g;
const NEWLINE_PATTERN = /\n/g;

const RANDOM_EXTRACT_OPTS = {
  action: 'query',
  explaintext: true,
  exsectionformat: 'plain',
  exsentences: 5,
  format: 'json',
  generator: 'random',
  grnlimit: 1,
  grnnamespace: ARTICLE_NAMESPACE,
  prop: 'extracts',
  redirects: true
};

const TRANSLATE_BASE_OPTS = {
  client: 'gtx',
  dt: 't'
};

// UTIL ////////////////////////////////////////////////////////////////////////

const get = (url, data) => new Promise((resolve, reject) => _needle2.default.request('get', url, data, (err, response, body) => err ? reject(err) : resolve(body)));

const head = ([member]) => member;

// RANDOM EXTRACT //////////////////////////////////////////////////////////////

const extractExtract = data => head(Object.values(data.query.pages)).extract;

const getRandomWikiExtract = () => get(WIKIPEDIA_API_URL, RANDOM_EXTRACT_OPTS).then(extractExtract);

////////////////////////////////////////////////////////////////////////////////

const extractTranslation = arr => head(arr).map(head).join(' ');

const mangle = str => mangle1(str).then(mangle2).then(mangle3);

const removeOffendingTokens = str => str.replace(ELISION_PATTERN, ',').replace(NEWLINE_PATTERN, '\\n');

const translator = (sl, tl) => q => get(TRANSLATE_API_URL, Object.assign({ q, sl, tl }, TRANSLATE_BASE_OPTS)).then(removeOffendingTokens).then(JSON.parse).then(extractTranslation);

const mangle1 = translator(TARGET_LANG, MANGLE_LANG_1);
const mangle2 = translator(MANGLE_LANG_1, MANGLE_LANG_2);
const mangle3 = translator(MANGLE_LANG_2, TARGET_LANG);

////////////////////////////////////////////////////////////////////////////////

exports.default = () => getRandomWikiExtract().then(mangle);