import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Pencil, Settings2, Play, ScrollText } from "lucide-react";
import { NodeConfigFields } from "./node-config-fields";
import { NodeSettingsFields } from "./node-settings-fields";
import { NodeOutputTab } from "./node-output-tab";
import { NodeLogsTab } from "./node-logs-tab";
import { NODE_TYPE_OPTIONS, DEFAULT_CONFIGS } from "../constants";
import type { EditNodeSheetProps } from "../types";

export function EditNodeSheet({
  editingNode,
  setEditingNode,
  editNodeName,
  setEditNodeName,
  editNodeDescription,
  setEditNodeDescription,
  editNodeType,
  setEditNodeType,
  editNodeConfig,
  setEditNodeConfig,
  editNodeSettings,
  setEditNodeSettings,
  onEditNode,
  nodeRunResult,
  nodeRunning,
  onRunNode,
}: EditNodeSheetProps) {
  return (
    <Sheet open={!!editingNode} onOpenChange={(open) => !open && setEditingNode(null)}>
      <SheetContent className="w-[480px] sm:w-[520px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            {editNodeName || "Edit Node"}
            {editNodeType && (
              <Badge variant="outline" className="text-[10px] font-normal capitalize">
                {NODE_TYPE_OPTIONS.find((o) => o.value === editNodeType)?.label ?? editNodeType}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Configure, inspect output, or view logs for this node.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="configuration" className="flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="mt-2 grid w-full grid-cols-3">
            <TabsTrigger value="configuration" className="gap-1.5 text-xs">
              <Settings2 className="size-3.5" />Config
            </TabsTrigger>
            <TabsTrigger value="output" className="gap-1.5 text-xs">
              <Play className="size-3.5" />Output
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5 text-xs">
              <ScrollText className="size-3.5" />Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-node-name" className="text-sm">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input id="edit-node-name" value={editNodeName}
                  onChange={(e) => setEditNodeName(e.target.value)} className="h-9" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-node-desc" className="text-sm">
                  Description{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea id="edit-node-desc" value={editNodeDescription}
                  onChange={(e) => setEditNodeDescription(e.target.value)}
                  placeholder="Describe what this node does..." rows={2}
                  className="text-sm resize-none" />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <Select value={editNodeType} onValueChange={(v) => {
                  setEditNodeType(v);
                  setEditNodeConfig({ ...(DEFAULT_CONFIGS[v] ?? {}) });
                }}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NODE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="size-3.5 text-muted-foreground" />
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">— {opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific config */}
              <NodeConfigFields nodeType={editNodeType} config={editNodeConfig} onChange={setEditNodeConfig} />

              {/* Settings Section */}
              <div className="pt-4 border-t">
                <NodeSettingsFields settings={editNodeSettings} onChange={setEditNodeSettings} />
              </div>
            </div>

            <SheetFooter className="mx-[-1.5rem] px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setEditingNode(null)}>Cancel</Button>
              <Button onClick={onEditNode} disabled={!editNodeName.trim()}>
                <Pencil className="size-4 mr-1.5" />Apply Changes
              </Button>
            </SheetFooter>
          </TabsContent>

          {/* Output Tab */}
          <TabsContent value="output" className="flex-1 flex flex-col min-h-0 mt-0">
            <NodeOutputTab result={nodeRunResult} isRunning={nodeRunning} onRun={onRunNode} />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="flex-1 flex flex-col min-h-0 mt-0">
            <NodeLogsTab logs={nodeRunResult?.logs ?? []} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
