"use client";

import { useState, useEffect } from "react";
import { Link, input } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { extractDomains, extractStatuses } from "@/lib/urls";
import { Card, CardBody } from "@nextui-org/react";
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
import { ErrorIcon, SearchIcon } from "@/components/icons";

import { HttpResult } from "../types";

export const ResultsTable = () => {
  const [data, setData] = useState<HttpResult[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
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
          setDomains(extractDomains(data));
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
            {domains.map((domain) => (
              <Chip
                key={uuidv4()}
                color="default"
                variant={domain == search ? "solid" : "bordered"}
                className="mt-5 mr-2 cursor-pointer"
                onClick={() => {
                  setSearch(domain);
                  handleSubmit(domain);
                }}
              >
                {domain}
              </Chip>
            ))}
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
        </form>
      )}

      {!loading && (
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
                  className={row.is_alive ? "text-default-400" : "text-danger"}
                >
                  <TimeAgo date={row.last_failed} />
                  <span className="text-success">
                    {row.last_failed ? "" : "Never Failed"}
                  </span>
                </TableCell>
                <TableCell>
                  <Link isExternal href={row.url} aria-label="Link">
                    <span className="text-default-400 break-words w-80 text-sm hover:text-default-900">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};
