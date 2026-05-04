import { Filter, Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface WorkflowsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  setIsCreateDialogOpen: (open: boolean) => void;
}

export function WorkflowsToolbar({
  search,
  onSearchChange,
  setIsCreateDialogOpen,
}: WorkflowsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="workflows-search"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Filter Sheet (Disabled for now as API doesn't support filters yet) */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" id="filter-button" className="relative opacity-50 cursor-not-allowed">
              <Filter className="size-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="w-80 sm:w-96">
            <SheetHeader className="px-6">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter options will be available soon.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2">
        <Button
          id="create-workflow-button"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="size-4" />
          Create Workflow
        </Button>
      </div>
    </div>
  );
}
