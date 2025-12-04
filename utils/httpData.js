export const readBody = (request) => {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", chunk => body += chunk.toString());
        request.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
        request.on("error", reject);
    });
};

export const getCookie = (request, name) => {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;
    const list = {};
    cookieHeader.split(`;`).forEach(function(cookie) {
        let [parts_name, ...parts_value] = cookie.split(`=`);
        list[parts_name.trim()] = parts_value.join(`=`);
    });
    return list[name];
};