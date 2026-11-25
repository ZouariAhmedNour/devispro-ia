import { useQuery } from "@tanstack/react-query";
import { listClients } from "./api";

export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: listClients });
}