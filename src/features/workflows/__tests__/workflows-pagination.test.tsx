import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowsPagination } from "../components/workflows-pagination";

describe("WorkflowsPagination", () => {
  const defaultMeta = { total: 50, page: 1, limit: 10 };
  const onPageChange = vi.fn();
  const onLimitChange = vi.fn();

  function renderPagination(
    meta = defaultMeta,
    pageFn = onPageChange,
    limitFn = onLimitChange,
  ) {
    return render(
      <WorkflowsPagination
        meta={meta}
        onPageChange={pageFn}
        onLimitChange={limitFn}
      />,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render showing information", () => {
    renderPagination();
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/workflows/)).toBeInTheDocument();
    // Verify the "Showing X to Y of Z" text content
    const showingText = screen.getByText(/Showing/).closest("p");
    expect(showingText?.textContent).toContain("1");
    expect(showingText?.textContent).toContain("10");
    expect(showingText?.textContent).toContain("50");
  });

  it("should render correct page info", () => {
    renderPagination({ total: 50, page: 3, limit: 10 });
    expect(screen.getByText("3")).toBeInTheDocument(); // current page
    expect(screen.getByText("5")).toBeInTheDocument(); // total pages
  });

  it("should disable prev buttons on first page", () => {
    renderPagination({ total: 50, page: 1, limit: 10 });
    expect(screen.getByLabelText("First page")).toBeDisabled();
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).not.toBeDisabled();
    expect(screen.getByLabelText("Last page")).not.toBeDisabled();
  });

  it("should disable next buttons on last page", () => {
    renderPagination({ total: 50, page: 5, limit: 10 });
    expect(screen.getByLabelText("First page")).not.toBeDisabled();
    expect(screen.getByLabelText("Previous page")).not.toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
    expect(screen.getByLabelText("Last page")).toBeDisabled();
  });

  it("should call onPageChange when clicking next", async () => {
    const user = userEvent.setup();
    renderPagination({ total: 50, page: 2, limit: 10 });

    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("should call onPageChange when clicking previous", async () => {
    const user = userEvent.setup();
    renderPagination({ total: 50, page: 3, limit: 10 });

    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should call onPageChange(1) when clicking first page", async () => {
    const user = userEvent.setup();
    renderPagination({ total: 50, page: 3, limit: 10 });

    await user.click(screen.getByLabelText("First page"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should call onPageChange with total pages when clicking last page", async () => {
    const user = userEvent.setup();
    renderPagination({ total: 50, page: 2, limit: 10 });

    await user.click(screen.getByLabelText("Last page"));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it("should show correct range on last page with uneven total", () => {
    renderPagination({ total: 23, page: 3, limit: 10 });
    // Showing 21 to 23 of 23
    const showingText = screen.getByText(/Showing/).closest("p");
    expect(showingText?.textContent).toContain("21");
    expect(showingText?.textContent).toContain("23");
  });

  it("should handle single page scenario", () => {
    renderPagination({ total: 5, page: 1, limit: 10 });
    expect(screen.getByLabelText("First page")).toBeDisabled();
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
    expect(screen.getByLabelText("Last page")).toBeDisabled();
  });
});
