import {HttpResult} from "../types";
export const extractDomains = (input: HttpResult[]): any => {
    const domainSet = new Set<string>();

    const isAliveCounter: {[key: string]: number} = {};
    const isDeadCounter: {[key: string]: number} = {};

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
        } catch (e) {
            console.error(`Invalid URL: ${obj.url}`);
        }
    });

    return {
        uniqDomains: Array.from(domainSet),
        isAliveCounter,
        isDeadCounter
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