import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, XCircle, ChevronRight, RefreshCw, AlertTriangle,
} from "lucide-react";
import type { NodeSettings, NodeSettingsFieldsProps } from "../types";

export function NodeSettingsFields({ settings, onChange }: NodeSettingsFieldsProps) {
  const update = <K extends keyof NodeSettings>(key: K, value: NodeSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Production Settings</p>
          <p className="text-xs text-muted-foreground">
            Configure retry policy, error handling, and timeout overrides for this node.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            settings.enabled ? "bg-primary" : "bg-muted-foreground/30",
          )}
          onClick={() => update("enabled", !settings.enabled)}
        >
          <span className={cn(
            "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            settings.enabled ? "translate-x-4" : "translate-x-0",
          )} />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Error Handling Strategy */}
          <div className="space-y-3 rounded-md border p-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Error Handling</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">On Error</Label>
              <Select value={settings.onError} onValueChange={(v) => update("onError", v as NodeSettings["onError"])}>
                <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fail" className="text-xs">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-3.5 text-red-500" /><span>Fail</span>
                      <span className="text-muted-foreground">— Stop the workflow</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="skip" className="text-xs">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="size-3.5 text-amber-500" /><span>Skip</span>
                      <span className="text-muted-foreground">— Continue to next node</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="retry" className="text-xs">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-3.5 text-blue-500" /><span>Retry</span>
                      <span className="text-muted-foreground">— Retry with backoff</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {settings.onError === "fail"
                  ? "The workflow will immediately stop if this node fails."
                  : settings.onError === "skip"
                    ? "If this node fails, it will be skipped and the next node will execute."
                    : "If this node fails, it will be retried according to the retry policy below."}
              </p>
            </div>
          </div>

          {/* Retry Policy */}
          {settings.onError === "retry" && (
            <div className="space-y-3 rounded-md border p-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Retry Policy</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Retries</Label>
                  <Input type="number" min={1} max={10} value={String(settings.maxRetries)}
                    onChange={(e) => update("maxRetries", Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="h-8 text-xs" />
                  <p className="text-[10px] text-muted-foreground">1–10</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Backoff Strategy</Label>
                  <Select value={settings.backoffStrategy}
                    onValueChange={(v) => update("backoffStrategy", v as NodeSettings["backoffStrategy"])}>
                    <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed" className="text-xs">Fixed</SelectItem>
                      <SelectItem value="linear" className="text-xs">Linear</SelectItem>
                      <SelectItem value="exponential" className="text-xs">Exponential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Initial Backoff Delay (ms)</Label>
                <Input type="number" min={100} max={60000} step={100}
                  value={String(settings.backoffDelayMs)}
                  onChange={(e) => update("backoffDelayMs", Math.max(100, Math.min(60000, Number(e.target.value))))}
                  className="h-8 text-xs w-40" />
                <p className="text-[10px] text-muted-foreground">
                  {settings.backoffStrategy === "fixed"
                    ? `Wait ${settings.backoffDelayMs}ms between each retry.`
                    : settings.backoffStrategy === "linear"
                      ? `Wait ${settings.backoffDelayMs}ms, ${settings.backoffDelayMs * 2}ms, ${settings.backoffDelayMs * 3}ms...`
                      : `Wait ${settings.backoffDelayMs}ms, ${settings.backoffDelayMs * 2}ms, ${settings.backoffDelayMs * 4}ms...`}
                </p>
              </div>
              {/* Visual retry timeline */}
              <div className="rounded-md border bg-background p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Retry Timeline Preview
                </p>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {Array.from({ length: settings.maxRetries + 1 }).map((_, i) => {
                    const delay = i === 0 ? 0
                      : settings.backoffStrategy === "fixed" ? settings.backoffDelayMs
                      : settings.backoffStrategy === "linear" ? settings.backoffDelayMs * i
                      : settings.backoffDelayMs * Math.pow(2, i - 1);
                    return (
                      <div key={i} className="flex items-center gap-1">
                        {i > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                              {delay >= 1000 ? `${(delay / 1000).toFixed(1)}s` : `${delay}ms`}
                            </span>
                            <div className="h-px w-6 bg-muted-foreground/30" />
                          </div>
                        )}
                        <div className={cn(
                          "flex items-center justify-center size-6 rounded-full text-[9px] font-medium shrink-0",
                          i === 0 ? "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                            : "bg-amber-500/15 text-amber-600 border border-amber-500/30",
                        )}>
                          {i === 0 ? "1st" : `R${i}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Timeout Override */}
          <div className="space-y-3 rounded-md border p-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timeout Override</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Timeout (ms)</Label>
              <Input type="number" min={0} max={300000} step={1000}
                value={String(settings.timeoutOverrideMs)}
                onChange={(e) => update("timeoutOverrideMs", Math.max(0, Math.min(300000, Number(e.target.value))))}
                placeholder="0 (use default)" className="h-8 text-xs w-40" />
              <p className="text-[10px] text-muted-foreground">
                {settings.timeoutOverrideMs > 0
                  ? `This node will timeout after ${settings.timeoutOverrideMs >= 1000 ? `${(settings.timeoutOverrideMs / 1000).toFixed(1)}s` : `${settings.timeoutOverrideMs}ms`}.`
                  : "Set to 0 to use the node type's default timeout."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
