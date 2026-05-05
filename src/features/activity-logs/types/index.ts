/**
 * Re-export Orval-generated types for convenience.
 * Components should import from this barrel or directly from @/api/generated/models.
 */
export type { ActivityLogItemDto as ActivityLogItem } from "@/api/generated/models";
export type { ActivityLogListResponseDto as ActivityLogsResponse } from "@/api/generated/models";
export type { ActivityLogControllerFindAllParams as ActivityLogQueryParams } from "@/api/generated/models";
export type { ActorInfoDto as ActivityLogActor } from "@/api/generated/models";
