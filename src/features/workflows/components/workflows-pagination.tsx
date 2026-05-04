import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkflowsPaginationProps {
  meta: { total: number; page: number; limit: number };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function WorkflowsPagination({
  meta,
  onPageChange,
  onLimitChange,
}: WorkflowsPaginationProps) {
  const totalPages = Math.ceil(meta.total / meta.limit);
  const canPrev = meta.page > 1;
  const canNext = meta.page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {Math.min((meta.page - 1) * meta.limit + 1, meta.total)}
        </span>{" "}
        to{" "}
        <span className="font-medium text-foreground">
          {Math.min(meta.page * meta.limit, meta.total)}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">{meta.total}</span>{" "}
        workflows
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Rows per page
          </span>
          <Select
            value={String(meta.limit)}
            onValueChange={(val) => onLimitChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(meta.limit)} />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label="First page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="text-sm px-2 text-muted-foreground whitespace-nowrap">
            Page{" "}
            <span className="font-medium text-foreground">{meta.page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={!canNext}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            aria-label="Last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
