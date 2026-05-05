import { useState } from "react";
import {
  LayoutDashboard,
  Settings,
  ChevronsUpDown,
  Building2,
  Check,
  Plus,
  CircleUser,
  Users,
  GitBranch,
  ScrollText,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganizationControllerFindAll } from "@/api/generated/organizations/organizations";
import {
  getSelectedOrganizationId,
  setSelectedOrganizationId,
} from "@/api/organization-store";
import { CreateOrganizationDialog } from "@/features/organization/components/create-organization-dialog";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type { MembershipResponseDto } from "@/api/generated/models";

interface Organization {
  id: string;
  name: string;
  memberCount: number;
}

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Workflows",
    url: "/workflows",
    icon: GitBranch,
  },
  {
    title: "Members",
    url: "/members",
    icon: Users,
  },
  {
    title: "Activity Logs",
    url: "/activity-logs",
    icon: ScrollText,
    requiredRoles: ["OWNER", "ADMIN"] as string[],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    requiredRoles: ["OWNER", "ADMIN"] as string[],
  },
  {
    title: "Profile",
    url: "/profile",
    icon: CircleUser,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useOrganizationControllerFindAll();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const organizations: Organization[] =
    (data as unknown as { data: Organization[] })?.data ?? [];

  const selectedOrgId = getSelectedOrganizationId();
  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

  const { user } = useAuth();
  const { data: member } = useMembershipControllerFindByUserId(
    selectedOrgId ?? "",
    user?.id ?? "",
    {
      query: {
        enabled: !!(selectedOrgId && user?.id),
      },
    },
  );

  const membershipData = member as unknown as MembershipResponseDto | undefined;

  const userRole = membershipData?.data?.role;

  const handleSwitchOrg = (org: Organization) => {
    setSelectedOrganizationId(org.id);
    // Force a re-render by navigating to the current page
    navigate(0);
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {selectedOrg?.name ?? "Select Organization"}
                      </span>
                      {userRole && (
                        <span className="truncate text-xs capitalize">
                          {userRole.toLowerCase()}
                        </span>
                      )}
                    </div>

                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Organizations
                  </DropdownMenuLabel>
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      className="gap-2 p-2"
                      onClick={() => handleSwitchOrg(org)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Building2 className="size-4 shrink-0" />
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <span className="truncate font-medium">{org.name}</span>
                      </div>
                      {org.id === selectedOrgId && (
                        <Check className="ml-auto size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 p-2"
                    onSelect={() => setIsDialogOpen(true)}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Create Organization
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  if (
                    item.requiredRoles &&
                    (!userRole || !item.requiredRoles.includes(userRole))
                  ) {
                    return null;
                  }

                  const isActive = location.pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <CreateOrganizationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
