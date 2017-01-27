'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _needle = require('needle');

var _needle2 = _interopRequireDefault(_needle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const url = 'http://thecatapi.com/api/images/get?format=html&results_per_page=1&size=full&api_key=MTM1MTQ;';

const additional = [{ url: 'http://i.imgur.com/2DSKvlJ.jpg', name: 'Barry', owns: 'garaden' }, { url: 'http://i.imgur.com/2wwX4Kr.jpg', name: 'Barry', owns: 'garaden' }, { url: 'http://i.imgur.com/x3smn8Hr.jpg', name: 'Harry and Cooper', owns: 'acconrad' }, { url: 'http://i.imgur.com/2y5rmjT.jpg', name: 'Harry and Cooper', owns: 'acconrad' }, {
    url: 'https://lh3.googleusercontent.com/aUbEDZDwD56aksYcnqP9Hb0e1KanljfskOldY06phPZEVEZQ1qvFFvJtVoXKUVP-fPFECnMeJ67h=w5760-h3600-rw-no',
    name: 'Spotis',
    owns: 'bathos'
}, {
    url: 'https://lh3.googleusercontent.com/DqqstyCZ0qIP5WXbYJs3dyxHzxiLqgMIfSLcYps0mqXSHngduc525biEOROyDm7yBSk0rEooFmuP=w5760-h3600-rw-no',
    name: 'Spottiscat Maocat Anycat',
    owns: 'bathos'
}, {
    url: 'https://lh3.googleusercontent.com/2x0_aFxs6DoBtYCv9JfDXghLvMCZwDT9NoA7iVVDT-Zqr1WJbi8pdWcBoOrI4yinEvMaNqvEUhtC=w5760-h3600-rw-no',
    name: 'Spottischketta',
    owns: 'bathos'
}];

const catPicker = concat => {
    const chosen = additional[Math.floor(Math.random() * additional.length)];
    if (Math.random() < 0.1) {
        return chosen;
    }
    return concat;
};

exports.default = () => {
    return new Promise((resolve, reject) => {
        _needle2.default.get(url, (err, response, body) => {
            if (body && body.match(/src="([^"]+)/)) {
                resolve(catPicker({ url: RegExp.$1, name: 'dogalant', owns: '???' }));
            } else {
                reject();
            }
        });
    });
};