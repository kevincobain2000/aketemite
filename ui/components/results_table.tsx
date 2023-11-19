"use client";

import { useState, useEffect } from "react";
import { Link, input } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Image,
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
          const { uniqDomains, isAliveCounter, isDeadCounter } =
            extractDomains(data);
          setDomains(uniqDomains);
          setIsAliveCounter(isAliveCounter);
          setIsDeadCounter(isDeadCounter);
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
                  console.log(domain);
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
                      </div>
                    )}
                    {isDeadCounter[domain] && (
                      <div className="flex gap-1">
                        <p className="font-bold text-danger-400 text-small">
                          {isDeadCounter[domain]}
                        </p>
                        <p className="text-danger-400 text-small">Not Alive</p>
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
              <TableColumn>IS ALIVE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>RESPONSE TIME</TableColumn>
              <TableColumn>RESPONSE SIZE</TableColumn>
              <TableColumn>LAST SUCCESS</TableColumn>
              <TableColumn>LAST FAILED</TableColumn>
              <TableColumn>URL</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No rows to display."}>
              {filteredData.map((row) => (
                <TableRow key={uuidv4()}>
                  <TableCell>
                    <Chip
                      color={row.is_alive ? "success" : "danger"}
                      variant={row.is_alive ? "shadow" : "bordered"}
                    >
                      <span className="font-bold">
                        {row.is_alive ? "YES" : "NO"}
                      </span>
                    </Chip>
                  </TableCell>
                  <TableCell
                    className={
                      row.is_alive
                        ? "font-semibold text-success"
                        : "font-semibold text-danger"
                    }
                  >
                    {row.response_code}
                  </TableCell>
                  <TableCell>{row.response_time}</TableCell>
                  <TableCell>{row.response_size}kb</TableCell>
                  <TableCell className="text-default-400">
                    <TimeAgo date={row.last_success} />
                    <span className="text-danger">
                      {row.last_success ? "" : "Never Success"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={
                      row.is_alive ? "text-default-400" : "text-danger"
                    }
                  >
                    <TimeAgo date={row.last_failed} />
                    <span className="text-success">
                      {row.last_failed ? "" : "Never Failed"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link isExternal href={row.url} aria-label="Link">
                      <span className="text-default-500 break-words w-80 text-sm hover:text-default-900">
                        {truncate(row.title, 100)}
                        <p
                          className={`${
                            row.is_alive ? "text-violet-600" : "text-danger"
                          } break-words w-80 hover:underline`}
                        >
                          {truncate(row.url, 150)}
                        </p>
                      </span>
                    </Link>
                    <p className="font-semibold text-default-400 text-xs pt-1">
                      {/* {row.http_assets.js_assets.alive > 0 && (
                            <span className="pr-2 text-default-300">JS alive {row.http_assets.js_assets.alive}</span>
                        )}
                        {row.http_assets.css_assets.alive > 0 && (
                            <span className="pr-2 text-default-300">CSS alive {row.http_assets.css_assets.alive}</span>
                        )}
                        {row.http_assets.img_assets.alive > 0 && (
                            <span className="pr-2 text-default-300">IMG alive {row.http_assets.img_assets.alive}</span>
                        )} */}
                      {row.http_assets.js_assets.dead > 0 && (
                        <span className="pr-2 text-danger">
                          JS dead {row.http_assets.js_assets.dead}
                        </span>
                      )}
                      {row.http_assets.css_assets.dead > 0 && (
                        <span className="pr-2 text-danger">
                          CSS dead {row.http_assets.css_assets.dead}
                        </span>
                      )}
                      {row.http_assets.img_assets.dead > 0 && (
                        <span className="pr-2 text-danger">
                          IMG dead {row.http_assets.img_assets.dead}
                        </span>
                      )}
                    </p>
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
