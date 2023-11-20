import {HttpResult} from "../types";
export const extractDomains = (input: HttpResult[]): any => {
    const domainSet = new Set<string>();
    const ogImages: Record<string, string> = {};

    const isAliveCounter: {[key: string]: number} = {};
    const isDeadCounter: {[key: string]: number} = {};
    const isDeadAssetsCounter: {[key: string]: number} = {};
    input.forEach(obj => {
        try {
            const url = new URL(obj.url);
            domainSet.add(`${url.hostname}`);
            if (obj.is_alive) {
                isAliveCounter[url.hostname] = isAliveCounter[url.hostname] || 0;
                isAliveCounter[url.hostname]++;
            } else {
                isDeadCounter[url.hostname] = isDeadCounter[url.hostname] || 0;
                isDeadCounter[url.hostname]++;
            }
            if (obj.http_assets.js_assets.dead + obj.http_assets.css_assets.dead + obj.http_assets.img_assets.dead > 0) {
                if (!isDeadAssetsCounter[url.hostname]) {
                    isDeadAssetsCounter[url.hostname] = 0;
                }
                isDeadAssetsCounter[url.hostname] += obj.http_assets.js_assets.dead + obj.http_assets.css_assets.dead + obj.http_assets.img_assets.dead;
            }
        } catch (e) {
            console.error(`Invalid URL: ${obj.url}`);
        }
    });

    input.forEach(obj => {
        let domain = '';
        // remove schema from obj.url
        domain = obj.url.replace(/(^\w+:|^)\/\//, '');
        ogImages[domain] = obj.og_image
    });

    return {
        uniqDomains: Array.from(domainSet),
        isAliveCounter,
        isDeadCounter,
        isDeadAssetsCounter,
        ogImages
    }
}

export const extractStatuses = (input: HttpResult[]): string[] => {
    const statusSet = new Set<string>();

    input.forEach(obj => {
        statusSet.add(`${obj.response_code}`);
    });

    return Array.from(statusSet);
}

export const stripTopLevelDomain = (domain: string): string => {
    const parts = domain.split('.');
    // return the first part
    if (parts.length === 1) {
        return domain;
    }
    return parts[0];
}