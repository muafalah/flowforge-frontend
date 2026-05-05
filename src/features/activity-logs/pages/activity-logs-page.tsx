import { useEffect, useRef, useState } from "react";
import { ActivityLogToolbar } from "../components/activity-log-toolbar";
import { ActivityLogTable } from "../components/activity-log-table";
import { ActivityLogPagination } from "../components/activity-log-pagination";
import { useActivityLogsQuery } from "../hooks/use-activity-logs-query";

export function ActivityLogsPage() {
  const {
    logs,
    meta,
    isLoading,
    isError,
    queryState,
    setPage,
    setLimit,
    setSearch,
    setAction,
    setTargetType,
    toggleSortOrder,
  } = useActivityLogsQuery();

  // Debounce search input so we don't fire API calls on every keystroke
  const [searchInput, setSearchInput] = useState(queryState.search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput, setSearch]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Activity Logs</h3>
          <p className="text-muted-foreground">
            View all activities performed by members in your organization.
          </p>
        </div>
      </div>

      {/* Toolbar: search + filters */}
      <ActivityLogToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        action={queryState.action}
        onActionChange={setAction}
        targetType={queryState.targetType}
        onTargetTypeChange={setTargetType}
      />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">
            Failed to load activity logs. Please try again later.
          </p>
        </div>
      )}

      {/* Table */}
      <ActivityLogTable
        logs={logs}
        isLoading={isLoading}
        sortOrder={queryState.sortOrder}
        onToggleSortOrder={toggleSortOrder}
      />

      {/* Pagination */}
      {!isLoading && logs.length > 0 && (
        <ActivityLogPagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}
    </div>
  );
}
