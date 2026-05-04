/**
 * Organization Store — Manages the currently selected organization ID.
 *
 * Persisted in localStorage so the selection survives page refreshes.
 * Cleared on logout alongside auth tokens.
 *
 * This module is intentionally decoupled from React context to avoid
 * circular dependencies with the Axios/custom-instance layer.
 */

const SELECTED_ORG_KEY = "selected_organization_id";

export const getSelectedOrganizationId = (): string | null =>
  localStorage.getItem(SELECTED_ORG_KEY);

export const setSelectedOrganizationId = (id: string): void => {
  localStorage.setItem(SELECTED_ORG_KEY, id);
};

export const clearSelectedOrganizationId = (): void => {
  localStorage.removeItem(SELECTED_ORG_KEY);
};
