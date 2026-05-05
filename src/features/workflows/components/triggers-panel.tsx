import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Power,
  PowerOff,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCronJobs, useWebhooks } from "../hooks/use-triggers";
import type { CronJob, Webhook as WebhookType } from "../types/trigger";

interface TriggersPanelProps {
  workflowId: string;
  readOnly?: boolean;
}

// ── Cron Job Card ──
function CronJobCard({
  cron,
  readOnly,
  onToggle,
  onDelete,
}: {
  cron: CronJob;
  readOnly: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="size-4 text-blue-500 shrink-0" />
            <span className="font-medium text-sm truncate">{cron.name}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] shrink-0",
                cron.isActive
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/30",
              )}
            >
              {cron.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={onToggle}
                title={cron.isActive ? "Disable" : "Enable"}
              >
                {cron.isActive ? (
                  <PowerOff className="size-3.5 text-orange-500" />
                ) : (
                  <Power className="size-3.5 text-emerald-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">
              {cron.cronExpression}
            </code>
            <span>({cron.timezone})</span>
          </div>
          {cron.description && (
            <p className="line-clamp-1">{cron.description}</p>
          )}
          {cron.nextRunAt && (
            <p>Next: {new Date(cron.nextRunAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cron Job</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-medium text-foreground">{cron.name}</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Webhook Card ──
function WebhookCard({
  webhook,
  readOnly,
  onToggle,
  onDelete,
  onRegenerate,
}: {
  webhook: WebhookType;
  readOnly: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
      <div className="rounded-lg border p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Webhook className="size-4 text-violet-500 shrink-0" />
            <span className="font-medium text-sm truncate">{webhook.name}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] shrink-0",
                webhook.isActive
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/30",
              )}
            >
              {webhook.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={onToggle}
              >
                {webhook.isActive ? (
                  <PowerOff className="size-3.5 text-orange-500" />
                ) : (
                  <Power className="size-3.5 text-emerald-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* URL */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Webhook URL
          </Label>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 bg-muted px-2 py-1 rounded text-[11px] font-mono truncate">
              {webhook.webhookUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => copyToClipboard(webhook.webhookUrl, "URL")}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        </div>

        {/* Secret */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Secret
          </Label>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 bg-muted px-2 py-1 rounded text-[11px] font-mono truncate">
              {showSecret ? webhook.secret : "••••••••••••••••"}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? (
                <EyeOff className="size-3" />
              ) : (
                <Eye className="size-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => copyToClipboard(webhook.secret, "Secret")}
            >
              <Copy className="size-3" />
            </Button>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={onRegenerate}
                title="Regenerate secret"
              >
                <RefreshCw className="size-3" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Send POST with header{" "}
          <code className="bg-muted px-1 rounded">
            X-Webhook-Secret: {"<secret>"}
          </code>
        </p>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-medium text-foreground">
                {webhook.name}
              </span>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Create Cron Dialog ──
function CreateCronDialog({
  open,
  onOpenChange,
  onCreate,
  isMutating,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: {
    name: string;
    cronExpression: string;
    timezone: string;
    description?: string;
  }) => Promise<unknown>;
  isMutating: boolean;
}) {
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("0 0 * * *");
  const [timezone, setTimezone] = useState("UTC");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate({
        name,
        cronExpression: expression,
        timezone,
        description: description || undefined,
      });
      toast.success("Cron job created");
      onOpenChange(false);
      setName("");
      setExpression("0 0 * * *");
      setDescription("");
    } catch {
      toast.error("Failed to create cron job");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Cron Job</DialogTitle>
          <DialogDescription>
            Schedule recurring workflow runs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nightly Sync"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="0 0 * * *"
              className="font-mono"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Format: minute hour day month weekday (e.g.,{" "}
              <code>*/5 * * * *</code> = every 5 minutes)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Asia/Jakarta">Asia/Jakarta</SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
              placeholder="What does this schedule do?"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isMutating || !name || !expression}>
              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Webhook Dialog ──
function CreateWebhookDialog({
  open,
  onOpenChange,
  onCreate,
  isMutating,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: { name: string; description?: string }) => Promise<unknown>;
  isMutating: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate({ name, description: description || undefined });
      toast.success("Webhook created");
      onOpenChange(false);
      setName("");
      setDescription("");
    } catch {
      toast.error("Failed to create webhook");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Create an endpoint to trigger this workflow from external services.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GitHub Push Hook"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
              placeholder="What triggers this webhook?"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isMutating || !name}>
              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──
export function TriggersPanel({
  workflowId,
  readOnly = false,
}: TriggersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cron");
  const [showCreateCron, setShowCreateCron] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);

  const {
    cronJobs,
    isLoading: cronLoading,
    isMutating: cronMutating,
    fetchCronJobs,
    createCronJob,
    updateCronJob,
    deleteCronJob,
  } = useCronJobs(workflowId);
  const {
    webhooks,
    isLoading: whLoading,
    isMutating: whMutating,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
  } = useWebhooks(workflowId);

  useEffect(() => {
    if (isOpen) {
      void fetchCronJobs();
      void fetchWebhooks();
    }
  }, [isOpen, fetchCronJobs, fetchWebhooks]);

  const handleToggleCron = useCallback(
    async (cron: CronJob) => {
      try {
        await updateCronJob(cron.id, { isActive: !cron.isActive });
        toast.success(cron.isActive ? "Cron job disabled" : "Cron job enabled");
      } catch {
        toast.error("Failed to update cron job");
      }
    },
    [updateCronJob],
  );

  const handleDeleteCron = useCallback(
    async (id: string) => {
      try {
        await deleteCronJob(id);
        toast.success("Cron job deleted");
      } catch {
        toast.error("Failed to delete cron job");
      }
    },
    [deleteCronJob],
  );

  const handleToggleWebhook = useCallback(
    async (wh: WebhookType) => {
      try {
        await updateWebhook(wh.id, { isActive: !wh.isActive });
        toast.success(wh.isActive ? "Webhook disabled" : "Webhook enabled");
      } catch {
        toast.error("Failed to update webhook");
      }
    },
    [updateWebhook],
  );

  const handleDeleteWebhook = useCallback(
    async (id: string) => {
      try {
        await deleteWebhook(id);
        toast.success("Webhook deleted");
      } catch {
        toast.error("Failed to delete webhook");
      }
    },
    [deleteWebhook],
  );

  const handleRegenerateSecret = useCallback(
    async (id: string) => {
      try {
        await updateWebhook(id, { regenerateSecret: true });
        toast.success("Secret regenerated");
      } catch {
        toast.error("Failed to regenerate secret");
      }
    },
    [updateWebhook],
  );

  const isLoading = cronLoading || whLoading;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Settings2 className="size-3.5" />
            Triggers
          </Button>
        </SheetTrigger>

        <SheetContent className="w-80 sm:w-96">
          <SheetHeader className="px-4 sm:px-6 border-b">
            <SheetTitle className="text-base font-semibold">
              Triggers
            </SheetTitle>
            <SheetDescription>
              Manage triggers for this workflow
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 sm:px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full h-9">
                  <TabsTrigger
                    value="cron"
                    className="flex-1 gap-1.5 text-xs h-7"
                  >
                    <Clock className="size-3.5" /> Cron ({cronJobs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="webhook"
                    className="flex-1 gap-1.5 text-xs h-7"
                  >
                    <Webhook className="size-3.5" /> Webhooks ({webhooks.length}
                    )
                  </TabsTrigger>
                </TabsList>

                {/* Cron Tab */}
                <TabsContent value="cron" className="mt-3 space-y-3">
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => setShowCreateCron(true)}
                    >
                      <Plus className="size-3.5" /> Add Cron Job
                    </Button>
                  )}
                  {isLoading && cronJobs.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : cronJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No cron jobs
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Schedule recurring runs for this workflow
                      </p>
                    </div>
                  ) : (
                    cronJobs.map((cron) => (
                      <CronJobCard
                        key={cron.id}
                        cron={cron}
                        readOnly={readOnly}
                        onToggle={() => void handleToggleCron(cron)}
                        onDelete={() => void handleDeleteCron(cron.id)}
                      />
                    ))
                  )}
                </TabsContent>

                {/* Webhook Tab */}
                <TabsContent value="webhook" className="mt-3 space-y-3">
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => setShowCreateWebhook(true)}
                    >
                      <Plus className="size-3.5" /> Add Webhook
                    </Button>
                  )}
                  {isLoading && webhooks.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : webhooks.length === 0 ? (
                    <div className="text-center py-8">
                      <Webhook className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No webhooks
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Create endpoints to trigger this workflow externally
                      </p>
                    </div>
                  ) : (
                    webhooks.map((wh) => (
                      <WebhookCard
                        key={wh.id}
                        webhook={wh}
                        readOnly={readOnly}
                        onToggle={() => void handleToggleWebhook(wh)}
                        onDelete={() => void handleDeleteWebhook(wh.id)}
                        onRegenerate={() => void handleRegenerateSecret(wh.id)}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <CreateCronDialog
        open={showCreateCron}
        onOpenChange={setShowCreateCron}
        onCreate={createCronJob}
        isMutating={cronMutating}
      />
      <CreateWebhookDialog
        open={showCreateWebhook}
        onOpenChange={setShowCreateWebhook}
        onCreate={createWebhook}
        isMutating={whMutating}
      />
    </>
  );
}
