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
import { Plus, Settings2, Play, ScrollText } from "lucide-react";
import { NodeConfigFields } from "./node-config-fields";
import { NodeSettingsFields } from "./node-settings-fields";
import { NodeOutputTab } from "./node-output-tab";
import { NodeLogsTab } from "./node-logs-tab";
import { NODE_TYPE_OPTIONS, DEFAULT_CONFIGS } from "../constants";
import type { AddNodeSheetProps } from "../types";

export function AddNodeSheet({
  open,
  onOpenChange,
  newNodeName,
  setNewNodeName,
  newNodeDescription,
  setNewNodeDescription,
  newNodeType,
  setNewNodeType,
  newNodeConfig,
  setNewNodeConfig,
  newNodeSettings,
  setNewNodeSettings,
  onAddNode,
  addNodeRunResult,
  addNodeRunning,
  onRunNewNode,
  setAddNodeRunResult,
  setAddNodeRunning,
}: AddNodeSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setAddNodeRunResult(null);
          setAddNodeRunning(false);
        }
      }}
    >
      <SheetContent className="w-[520px] sm:w-[520px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            Add Node
            <Badge variant="outline" className="text-xs font-normal">
              {NODE_TYPE_OPTIONS.find((o) => o.value === newNodeType)?.label ?? newNodeType}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Configure and test a new node before adding it to the workflow.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="configuration" className="flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="grid w-full grid-cols-3">
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
                <Label htmlFor="add-node-name" className="text-sm">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input id="add-node-name" value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="e.g. Fetch User Data" className="h-9" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="add-node-desc" className="text-sm">
                  Description{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea id="add-node-desc" value={newNodeDescription}
                  onChange={(e) => setNewNodeDescription(e.target.value)}
                  placeholder="Describe what this node does..." rows={2}
                  className="text-sm resize-none" />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <Select value={newNodeType} onValueChange={(v) => {
                  setNewNodeType(v);
                  setNewNodeConfig({ ...(DEFAULT_CONFIGS[v] ?? {}) });
                  setAddNodeRunResult(null);
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
              <NodeConfigFields nodeType={newNodeType} config={newNodeConfig} onChange={setNewNodeConfig} />

              {/* Settings Section */}
              <div className="pt-4 border-t">
                <NodeSettingsFields settings={newNodeSettings} onChange={setNewNodeSettings} />
              </div>
            </div>

            <SheetFooter className="mx-[-1.5rem] px-6 py-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={onAddNode} disabled={!newNodeName.trim()}>
                <Plus className="size-4 mr-1.5" />Add to Graph
              </Button>
            </SheetFooter>
          </TabsContent>

          {/* Output Tab */}
          <TabsContent value="output" className="flex-1 flex flex-col min-h-0 mt-0">
            <NodeOutputTab result={addNodeRunResult} isRunning={addNodeRunning} onRun={onRunNewNode} />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="flex-1 flex flex-col min-h-0 mt-0">
            <NodeLogsTab logs={addNodeRunResult?.logs ?? []} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
