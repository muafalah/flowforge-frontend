import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Overview of your FlowForge workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Welcome, {user?.name ?? "User"}
            </CardTitle>
            <CardDescription>Start building workflows.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is your protected dashboard area. More features coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
