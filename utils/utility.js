export const readBody = (request) => {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", chunk => body += chunk.toString());

        request.on("end", () => {
            if (!body) return resolve({});

            const contentType = request.headers["content-type"] || "";

            try {
                if (contentType.includes("application/json")) {
                    return resolve(JSON.parse(body));
                }

                if (contentType.includes("application/x-www-form-urlencoded")) {
                    const params = new URLSearchParams(body);
                    return resolve(Object.fromEntries(params.entries()));
                }
                resolve({});
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