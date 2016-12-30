'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _needle = require('needle');

var _needle2 = _interopRequireDefault(_needle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const url = 'http://thecatapi.com/api/images/get?format=html&results_per_page=1&size=full&api_key=MTM1MTQ;';

exports.default = () => {
    return new Promise((resolve, reject) => {
        _needle2.default.get(url, (err, response, body) => {
            if (body && body.match(/src="([^"]+)/)) {
                resolve(RegExp.$1);
            } else {
                reject();
            }
        });
    });
};