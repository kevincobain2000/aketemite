import {HttpResult} from "../types";
export const extractDomains = (input: HttpResult[]): string[] => {
    const domainSet = new Set<string>();

    input.forEach(obj => {
        try {
            const url = new URL(obj.url);
            domainSet.add(`${url.hostname}`);
        } catch (e) {
            console.error(`Invalid URL: ${obj.url}`);
        }
    });

    return Array.from(domainSet);
}

export const extractStatuses = (input: HttpResult[]): string[] => {
    const statusSet = new Set<string>();

    input.forEach(obj => {
        statusSet.add(`${obj.response_code}`);
    });

    return Array.from(statusSet);
}