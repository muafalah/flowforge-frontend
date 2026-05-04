import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NodeConfigFieldsProps } from "../types";

export function NodeConfigFields({
  nodeType,
  config,
  onChange,
}: NodeConfigFieldsProps) {
  const update = (key: string, value: unknown) =>
    onChange({ ...config, ...{ [key]: value } });

  switch (nodeType) {
    case "http_call":
      return (
        <div className="space-y-3 rounded-md border p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            HTTP Call Configuration
          </p>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Method</Label>
              <Select
                value={String(config.method ?? "GET")}
                onValueChange={(v) => update("method", v)}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL</Label>
              <Input
                value={String(config.url ?? "")}
                onChange={(e) => update("url", e.target.value)}
                placeholder="https://api.example.com/data"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Headers <span className="text-muted-foreground">(JSON)</span>
            </Label>
            <Textarea
              value={String(config.headers ?? "{}")}
              onChange={(e) => update("headers", e.target.value)}
              placeholder='{"Authorization": "Bearer ..."}'
              rows={2}
              className="text-xs font-mono resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Body <span className="text-muted-foreground">(JSON)</span>
            </Label>
            <Textarea
              value={String(config.body ?? "")}
              onChange={(e) => update("body", e.target.value)}
              placeholder='{"key": "value"}'
              rows={2}
              className="text-xs font-mono resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Timeout (ms)</Label>
            <Input
              type="number"
              value={String(config.timeoutMs ?? 30000)}
              onChange={(e) => update("timeoutMs", Number(e.target.value))}
              className="h-8 text-xs w-32"
            />
          </div>
        </div>
      );

    case "script_execution":
      return (
        <div className="space-y-3 rounded-md border p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Script Execution Configuration
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Language</Label>
            <Select
              value={String(config.language ?? "javascript")}
              onValueChange={(v) => update("language", v)}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "javascript", label: "JavaScript" },
                  { value: "python", label: "Python" },
                  { value: "shell", label: "Shell" },
                ].map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}
                    className="text-xs"
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Script</Label>
            <Textarea
              value={String(config.script ?? "")}
              onChange={(e) => update("script", e.target.value)}
              placeholder="// Your code here..."
              rows={4}
              className="text-xs font-mono resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Timeout (ms)</Label>
            <Input
              type="number"
              value={String(config.timeoutMs ?? 60000)}
              onChange={(e) => update("timeoutMs", Number(e.target.value))}
              className="h-8 text-xs w-32"
            />
          </div>
        </div>
      );

    case "delay":
      return (
        <div className="space-y-3 rounded-md border p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Delay Configuration
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Duration (ms)</Label>
            <Input
              type="number"
              value={String(config.durationMs ?? 1000)}
              onChange={(e) => update("durationMs", Number(e.target.value))}
              placeholder="1000"
              className="h-8 text-xs w-40"
            />
            <p className="text-[10px] text-muted-foreground">
              {Number(config.durationMs ?? 1000) >= 1000
                ? `≈ ${(Number(config.durationMs ?? 1000) / 1000).toFixed(1)}s`
                : `${config.durationMs ?? 1000}ms`}
            </p>
          </div>
        </div>
      );

    case "conditional":
      return (
        <div className="space-y-3 rounded-md border p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Conditional Configuration
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Expression</Label>
            <Textarea
              value={String(config.expression ?? "")}
              onChange={(e) => update("expression", e.target.value)}
              placeholder='e.g. inputs[0]?.body?.status === "active"'
              rows={2}
              className="text-xs font-mono resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              JavaScript expression that evaluates to <code className="bg-muted px-1 rounded">true</code> or{" "}
              <code className="bg-muted px-1 rounded">false</code>.
              Use <code className="bg-muted px-1 rounded">variables</code> to access shared context
              and <code className="bg-muted px-1 rounded">inputs</code> for predecessor outputs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">True Label</Label>
              <Input
                value={String(config.trueLabel ?? "Yes")}
                onChange={(e) => update("trueLabel", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">False Label</Label>
              <Input
                value={String(config.falseLabel ?? "No")}
                onChange={(e) => update("falseLabel", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Branching guidance */}
          <div className="rounded-md border bg-background p-2.5 space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              How Branching Works
            </p>
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600">True</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Connect the green handle (✓) to the node(s) that should run when the expression is true.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-block size-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-semibold text-red-600">False</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Connect the red handle (✗) to the node(s) that should run when the expression is false.
              </p>
            </div>
            <div className="border-t pt-1.5 mt-1.5">
              <p className="text-[10px] text-muted-foreground">
                <strong>Example expressions:</strong>
              </p>
              <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                <li><code className="bg-muted px-1 rounded">@{"{{"} Name {"}}"} === &quot;Emily&quot;</code> — template (auto-quoted)</li>
                <li><code className="bg-muted px-1 rounded">variables.status === &quot;active&quot;</code> — direct JS access</li>
                <li><code className="bg-muted px-1 rounded">variables.count &gt; 10</code></li>
                <li><code className="bg-muted px-1 rounded">true</code> (always take True branch)</li>
              </ul>
            </div>
          </div>
        </div>
      );

    case "set_variable":
      return (
        <div className="space-y-3 rounded-md border p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Set Variable Configuration
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Variable Name</Label>
            <Input
              value={String(config.variableName ?? "")}
              onChange={(e) => update("variableName", e.target.value)}
              placeholder="e.g. VariableName"
              className="h-8 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Extraction Expression</Label>
            <Input
              value={String(config.expression ?? "")}
              onChange={(e) => update("expression", e.target.value)}
              placeholder="e.g. input.data"
              className="h-8 text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Extract data from the incoming node's output using JS expression.
              Use <code>input</code> to refer to the incoming data.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
