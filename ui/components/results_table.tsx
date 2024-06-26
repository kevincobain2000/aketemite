"use client";

import { useState, useEffect } from "react";
import { Link, input } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
// import next js image
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
} from "@nextui-org/react";
import {
  extractDomains,
  extractStatuses,
  stripTopLevelDomain,
} from "@/lib/urls";
// @ts-ignore
import TimeAgo from "react-timeago";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import { Chip } from "@nextui-org/react";
import {
  ErrorIcon,
  SuccessIcon,
  WarningIcon,
  SearchIcon,
} from "@/components/icons";

import { HttpResult } from "../types";

export const ResultsTable = () => {
  const [data, setData] = useState<HttpResult[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [isAliveCounter, setIsAliveCounter] = useState<{
    [key: string]: number;
  }>({});
  const [ogImages, setOgImages] = useState<{ [key: string]: string }>({});
  const [isDeadAssetsCounter, setIsDeadAssetsCounter] = useState<{
    [key: string]: number;
  }>({});
  const [isDeadCounter, setIsDeadCounter] = useState<{ [key: string]: number }>(
    {}
  );
  const [filteredData, setFilteredData] = useState<HttpResult[]>([]);
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSubmit = (search: string) => {
    if (!search) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter((row) => {
      return (
        row.title.toLowerCase().includes(search.toLowerCase()) ||
        row.url.toLowerCase().includes(search.toLowerCase()) ||
        row.response_code.toString().includes(search)
      );
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL as string, {
      next: {
        tags: ["api"],
        revalidate: 1,
      },
    })
      .then((response) => {
        setLoading(false);
        if (response.status !== 200) {
          setError(`Request failed with status: ${response.status}`);
          throw new Error(`Request failed with status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data instanceof Array) {
          setData(data);
          setFilteredData(data);
          const {
            uniqDomains,
            isAliveCounter,
            isDeadCounter,
            ogImages,
            isDeadAssetsCounter,
          } = extractDomains(data);
          setDomains(uniqDomains);
          setIsAliveCounter(isAliveCounter);
          setIsDeadCounter(isDeadCounter);
          setOgImages(ogImages);
          setIsDeadAssetsCounter(isDeadAssetsCounter);
          setStatuses(extractStatuses(data));
        } else {
          setError("Invalid response from server");
        }
      })
      .catch((error) => {
        setLoading(false);
        setError(error.message);
      });
  }, []);

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <>
      {error && (
        <Card className="mb-5 bg-red-600">
          <CardBody>
            <p>
              <ErrorIcon className="mr-2 inline" />
              {error}
            </p>
          </CardBody>
        </Card>
      )}
      {loading && (
        <div className="text-center">
          <Spinner label="Loading..." color="warning" />
        </div>
      )}
      {!loading && (
        <form className="">
          <div>
            <Input
              classNames={{
                inputWrapper: "bg-default-100",
                input: "text-sm",
              }}
              className="w-full block"
              value={search}
              labelPlacement="outside"
              placeholder="Type to filter results..."
              isClearable
              onClear={() => {
                setSearch("");
                setFilteredData(data);
              }}
              onChange={(e) => {
                setSearch(e.target.value);
                handleSubmit(e.target.value);
              }}
              startContent={
                <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
              }
              type="text"
            />
          </div>

          <div>
            {statuses.map((status) => (
              <Chip
                key={uuidv4()}
                color={status >= "200" && status < "400" ? "success" : "danger"}
                variant={status == search ? "solid" : "bordered"}
                className="mt-5 mr-2 cursor-pointer"
                onClick={() => {
                  setSearch(status);
                  handleSubmit(status);
                }}
              >
                {status}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap">
            {domains.map((domain) => (
              <div
                className="w-1/4 p-2"
                key={uuidv4()}
                onClick={() => {
                  setSearch(domain);
                  handleSubmit(domain);
                }}
              >
                <Card className="mt-5 cursor-pointer hover:shadow-lg hover:bg-opacity-50">
                  <CardHeader className="flex gap-3">
                    {isDeadCounter[domain] && !isAliveCounter[domain] && (
                      <ErrorIcon className="text-danger" />
                    )}
                    {isDeadCounter[domain] && isAliveCounter[domain] && (
                      <WarningIcon className="text-warning" />
                    )}
                    {!isDeadCounter[domain] && (
                      <SuccessIcon className="text-success" />
                    )}
                    {isDeadAssetsCounter[domain] > 0 && (
                      <WarningIcon className="text-warning" />
                    )}
                    <Image
                      src={ogImages[domain] ?? `//${domain}/favicon.ico`}
                      alt="image"
                      width={40}
                      height={40}
                      onError={(e) => {
                        e.currentTarget.src = "/aketemite/favicon.ico";
                      }}
                      objectFit="contain"
                    />
                    <div className="flex flex-col">
                      <p
                        className={`${
                          isDeadCounter[domain] && !isAliveCounter[domain]
                            ? "text-danger"
                            : "" ||
                              (isDeadCounter[domain] && isAliveCounter[domain])
                            ? "text-warning"
                            : "" || !isDeadCounter[domain]
                            ? "text-success"
                            : ""
                        } text-md font-light`}
                      >
                        {stripTopLevelDomain(domain)}
                      </p>
                      <p className="text-small text-default-500">{domain}</p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <Divider />
                  <CardFooter className="gap-3">
                    {isAliveCounter[domain] && (
                      <div className="flex gap-1">
                        <p className="font-bold text-default-400 text-small">
                          {isAliveCounter[domain]}
                        </p>
                        <p className="text-default-400 text-small">Alive</p>
                        {isDeadAssetsCounter[domain] && (
                          <p className="text-warning text-small">
                            {isDeadAssetsCounter[domain]} Dead Assets
                          </p>
                        )}
                      </div>
                    )}
                    {isDeadCounter[domain] && (
                      <div className="flex gap-1">
                        <p className="font-bold text-danger-400 text-small">
                          {isDeadCounter[domain]}
                        </p>
                        <p className="text-danger-400 text-small font-bold">
                          Not Alive
                        </p>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </form>
      )}
      {!loading && (
        <>
          <span className="text-default-400 float-right font-bold text-sm">
            {filteredData.length + " rows"}
          </span>
          <Table className="pt-5">
            <TableHeader>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>RESP TIME</TableColumn>
              <TableColumn>SIZE</TableColumn>
              <TableColumn>LAST SUCCESS</TableColumn>
              <TableColumn>LAST FAILED</TableColumn>
              <TableColumn>URL</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No rows to display."}>
              {filteredData.map((row) => (
                <TableRow key={uuidv4()}>
                  <TableCell
                    className={
                      row.is_alive
                        ? "text-success font-semibold"
                        : "font-bold text-danger"
                    }
                  >
                    {row.response_code}
                  </TableCell>
                  <TableCell>{row.response_time}</TableCell>
                  <TableCell>
                    <span className="text-default-400">{row.response_size}kb</span>
                  </TableCell>
                  <TableCell className="text-default-400">
                    <TimeAgo date={row.last_success} />
                    <span className="text-danger font-bold">
                      {row.last_success ? "" : "Never Success"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={
                      row.is_alive
                        ? "text-default-400"
                        : "text-danger font-bold"
                    }
                  >

                    <span className="">
                      {row.last_failed ? (
                        <>
                            <ErrorIcon className="text-danger inline-block pr-1" />
                            <TimeAgo date={row.last_failed} />
                        </>
                      ) : (
                        <>
                            Never Failed
                        </>

                      )}

                    </span>
                  </TableCell>
                  <TableCell>
                    <Card className="max-w-[400px] shadow-none">
                      <CardBody>
                        <Link isExternal href={row.url} aria-label="Link">
                          <span className="text-default-500 break-words w-80 text-sm hover:text-default-900">
                            <p
                              className={`${
                                row.http_assets.js_assets.dead +
                                  row.http_assets.css_assets.dead +
                                  row.http_assets.img_assets.dead >
                                0
                                  ? "text-warning-500"
                                  : row.is_alive
                                  ? ""
                                  : "text-danger font-bold"
                              } break-words w-80 hover:underline`}
                            >
                              {truncate(row.url, 80)}
                            </p>
                          </span>
                        </Link>
                      </CardBody>
                      {row.http_assets.js_assets.dead +
                        row.http_assets.css_assets.dead +
                        row.http_assets.img_assets.dead >
                        0 && (
                        <>
                          <Divider />
                          <CardFooter>
                            <p className="text-default-500 text-xs">
                              {row.http_assets.js_assets.dead > 0 && (
                                <span className="pr-2 font-semibold">
                                  JS errors {row.http_assets.js_assets.dead}
                                </span>
                              )}
                              {row.http_assets.css_assets.dead > 0 && (
                                <span className="pr-2 font-semibold">
                                  CSS errors {row.http_assets.css_assets.dead}
                                </span>
                              )}
                              {row.http_assets.img_assets.dead > 0 && (
                                <span className="pr-2 font-semibold">
                                  IMG errors {row.http_assets.img_assets.dead}
                                </span>
                              )}
                            </p>
                          </CardFooter>
                        </>
                      )}
                    </Card>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
};
