import { useQuery } from "@tanstack/react-query";
import { listActiveCatalogItems } from "./api";

export function useCatalogItems() {
  return useQuery({ queryKey: ["catalog-items", "active"], queryFn: listActiveCatalogItems });
}