import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useWorkflowDetail } from "../hooks/use-workflow-detail";
import { WorkflowHeader } from "../components/workflow-header";
import { DAGEditor } from "../components/dag-editor";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type {
  WorkflowDataDto,
  MembershipResponseDto,
} from "@/api/generated/models";
import type { DagDefinition } from "../types";
import { useWorkflowVersionControllerFindAllVersions } from "@/api/generated/workflow-versions/workflow-versions";
import { getSelectedOrganizationId } from "@/api/organization-store";
import type { VersionListResponseDto } from "@/api/generated/models";

function DetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex-1 m-6 mt-0">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">Workflow not found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        The workflow you&apos;re looking for doesn&apos;t exist or you
        don&apos;t have permission to view it.
      </p>
    </div>
  );
}

export function WorkflowDetailPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { workflow, isLoading, isError, organizationId } = useWorkflowDetail(
    workflowId ?? "",
  );

  const { user } = useAuth();
  const orgId = getSelectedOrganizationId() ?? "";

  // Fetch current user's role
  const { data: membershipData } = useMembershipControllerFindByUserId(
    orgId,
    user?.id ?? "",
    {
      query: {
        enabled: !!(orgId && user?.id),
      },
    },
  );

  const membership = membershipData as unknown as
    | MembershipResponseDto
    | undefined;
  const userRole = membership?.data?.role;

  // Fetch all versions for history + active definition
  const { data: versionsData } = useWorkflowVersionControllerFindAllVersions(
    orgId,
    workflowId ?? "",
    {
      page: 1,
      limit: 100,
      sortOrder: "desc",
    },
    {
      query: {
        enabled: !!(orgId && workflowId),
      },
    },
  );

  const versionsResponse = versionsData as unknown as
    | VersionListResponseDto
    | undefined;
  const versions = versionsResponse?.data ?? [];
  const activeVersion = versions.find((v) => v.isActive);
  const activeDefinition = activeVersion?.definition as unknown as
    | DagDefinition
    | undefined;

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !workflow) {
    return <ErrorState />;
  }

  const workflowData = workflow as unknown as WorkflowDataDto;

  // Determine if DAG editor should be read-only:
  // - OWNER/ADMIN: always can edit
  // - MEMBER: can edit only if workflow access = EDITOR
  const isOwnerOrAdmin = userRole === "OWNER" || userRole === "ADMIN";
  const workflowAccess =
    (workflowData.access as string | undefined) ?? "EDITOR";
  const readOnly = !isOwnerOrAdmin && workflowAccess === "VIEWER";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Compact header */}
      <div className="shrink-0 pb-3">
        <WorkflowHeader
          workflow={workflowData}
          organizationId={organizationId}
          userRole={userRole as "OWNER" | "ADMIN" | "MEMBER"}
        />
      </div>

      {/* DAG Editor — takes remaining height */}
      <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
        <DAGEditor
          workflowId={workflowData.id}
          initialDefinition={activeDefinition ?? null}
          versions={versions}
          activeVersionNumber={activeVersion?.version}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
