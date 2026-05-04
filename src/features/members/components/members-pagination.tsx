import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { PaginationMeta } from "../types";

interface MembersPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function MembersPagination({
  meta,
  onPageChange,
  onLimitChange,
}: MembersPaginationProps) {
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;
  const isFirstPage = meta.page <= 1;
  const isLastPage = meta.page >= totalPages;

  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-row gap-3 items-center justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {/* Info text */}
        <p className="hidden lg:block border-r pr-3 py-0.5 text-sm text-muted-foreground">
          {meta.total === 0 ? (
            "No results"
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-foreground">{startItem}</span>{" "}
              to <span className="font-medium text-foreground">{endItem}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{meta.total}</span>
            </>
          )}
        </p>
        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="hidden md:block whitespace-nowrap text-sm text-muted-foreground">
            Rows
          </span>
          <Select
            value={String(meta.limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger id="members-page-size" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Page info */}
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="hidden md:inline">Page</span>{" "}
          <span className="font-medium text-foreground">{meta.page}</span> of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={isFirstPage}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={isLastPage}
            aria-label="Go to next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            aria-label="Go to last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
