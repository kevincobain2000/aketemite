import {SVGProps} from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type HttpResult = {
    is_alive: boolean;
    response_code: number;
    response_time: string;
    response_size: number;
    title: string;
    url: string;
    last_success: string;
    last_failed: string;
  };