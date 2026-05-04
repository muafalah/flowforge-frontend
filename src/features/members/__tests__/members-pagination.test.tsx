import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembersPagination } from "../components/members-pagination";

describe("MembersPagination", () => {
  const defaultMeta = {
    total: 25,
    page: 1,
    limit: 10,
  };

  it("should render pagination info correctly", () => {
    render(
      <MembersPagination
        meta={defaultMeta}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
      />
    );

    expect(screen.getAllByText("10").length).toBeGreaterThan(0); // end
    expect(screen.getByText("25")).toBeInTheDocument(); // total
    expect(screen.getAllByText(/Page/i).length).toBeGreaterThan(0);
  });

  it("should disable previous buttons on first page", () => {
    render(
      <MembersPagination
        meta={defaultMeta}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Go to first page")).toBeDisabled();
    expect(screen.getByLabelText("Go to previous page")).toBeDisabled();
    expect(screen.getByLabelText("Go to next page")).not.toBeDisabled();
    expect(screen.getByLabelText("Go to last page")).not.toBeDisabled();
  });

  it("should disable next buttons on last page", () => {
    render(
      <MembersPagination
        meta={{ ...defaultMeta, page: 3 }}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Go to first page")).not.toBeDisabled();
    expect(screen.getByLabelText("Go to previous page")).not.toBeDisabled();
    expect(screen.getByLabelText("Go to next page")).toBeDisabled();
    expect(screen.getByLabelText("Go to last page")).toBeDisabled();
  });

  it("should call onPageChange when clicking buttons", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    
    render(
      <MembersPagination
        meta={{ ...defaultMeta, page: 2 }}
        onPageChange={onPageChange}
        onLimitChange={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Go to first page"));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByLabelText("Go to previous page"));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByLabelText("Go to next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByLabelText("Go to last page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("should render 'No results' if total is 0", () => {
    render(
      <MembersPagination
        meta={{ total: 0, page: 1, limit: 10 }}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
      />
    );

    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});
