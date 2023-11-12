"use client";

import { useState, useEffect } from "react";
import { Link, input } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
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
import { SearchIcon } from "@/components/icons";

type HttpResult = {
  is_alive: boolean;
  response_code: number;
  response_time: string;
  response_size: number;
  title: string;
  url: string;
  last_success: string;
  last_failed: string;
};

export const ResultsTable = () => {
  const [data, setData] = useState<HttpResult[]>([]);
  const [filteredData, setFilteredData] = useState<HttpResult[]>([]);
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    fetch(process.env.NEXT_PUBLIC_API_URL as string)
      .then((response) => {
        setLoading(false);
        if (response.status !== 200) {
          setError(`Request failed with status: ${response.status}`);
          throw new Error(`Request failed with status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setData(data);
        setFilteredData(data);
      })
      .catch((error) => {
        setLoading(false);
        setError(error.message);
      });
  }, []);

  return (
    <>
      {error && (
        <div className="text-center pb-5">
          <p className="text-danger">{error}</p>
        </div>
      )}
      {loading && (
        <div className="text-center">
          <Spinner label="Loading..." color="warning" />
        </div>
      )}
      {!loading && (
        <form onSubmit={handleSubmit} className="flex justify-between">
          <Input
            classNames={{
              inputWrapper: "bg-default-100",
              input: "text-sm",
            }}
            value={search}
            className="mr-5"
            labelPlacement="outside"
            placeholder="Type to filter results..."
            isClearable
            onClear={() => {
              setSearch("");
              setFilteredData(data);
            }}
            onChange={(e) => setSearch(e.target.value)}
            startContent={
              <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
            }
            type="text"
          />
          <Button color="warning" variant="shadow" type="submit">
            Filter
          </Button>
        </form>
      )}

      {!loading && (
        <Table className="pt-5">
          <TableHeader>
            <TableColumn>IS ALIVE</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>RESPONSE TIME</TableColumn>
            <TableColumn>RESPONSE SIZE</TableColumn>
            <TableColumn>SUCCESS</TableColumn>
            <TableColumn>FAILED</TableColumn>
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
                </TableCell>
                <TableCell className="text-danger">
                  <TimeAgo date={row.last_failed} />
                </TableCell>
                <TableCell>
                  <Link isExternal href={row.url} aria-label="Link">
                    <span className="text-default-400 break-words w-96 text-sm hover:text-default-900">
                      {row.title}
                      <p
                        className={`${
                          row.is_alive ? "text-indigo-600" : "text-danger"
                        } break-words w-96 hover:underline`}
                      >
                        {row.url}
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
