import needle from 'needle';

const url = 'http://thecatapi.com/api/images/get?format=html&results_per_page=1&size=full&api_key=MTM1MTQ;';

export default () => {
    return new Promise((resolve, reject) => {
        needle.get(url, (err, response, body) => {
            if (body && body.match(/src="([^"]+)/)) {
                resolve(RegExp.$1);
            } else {
                reject();
            }
        });
    });
};
