import { useQuery } from "@tanstack/react-query";
import { listQuotes } from "./api";

export const quoteKeys = {
  all: ["quotes"] as const,
  list: () => [...quoteKeys.all, "list"] as const,
};

export function useQuotes() {
  return useQuery({ queryKey: quoteKeys.list(), queryFn: listQuotes });
}