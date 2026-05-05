import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Globe,
  Code,
  Timer,
  GitFork,
  Database,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAiGenerate } from "../../../hooks/use-ai-generate";
import type { DagDefinition } from "../../../types";

interface AiGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (definition: DagDefinition) => void;
  hasExistingNodes: boolean;
}

const EXAMPLE_PROMPTS = [
  "Check API health every minute, send Slack alert if down",
  "Fetch user data from REST API and transform the response",
  "Login to API, save token, then fetch protected resource",
  "Run a data validation script, if pass continue, else send alert",
];

const NODE_TYPE_ICONS: Record<string, typeof Globe> = {
  http_call: Globe,
  script_execution: Code,
  delay: Timer,
  conditional: GitFork,
  set_variable: Database,
};

const NODE_TYPE_LABELS: Record<string, string> = {
  http_call: "HTTP Call",
  script_execution: "Script",
  delay: "Delay",
  conditional: "Conditional",
  set_variable: "Set Variable",
};

export function AiGenerateDialog({
  open,
  onOpenChange,
  onApply,
  hasExistingNodes,
}: AiGenerateDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<DagDefinition | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { generate, isGenerating, error, clearError } = useAiGenerate();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || prompt.trim().length < 10) return;
    clearError();
    setPreview(null);

    const definition = await generate(prompt.trim());
    if (definition) {
      setPreview(definition);
    }
  }, [prompt, generate, clearError]);

  const handleApply = useCallback(() => {
    if (!preview) return;

    if (hasExistingNodes && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    onApply(preview);
    setPrompt("");
    setPreview(null);
    setShowConfirm(false);
    onOpenChange(false);
  }, [preview, hasExistingNodes, showConfirm, onApply, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isGenerating) {
      setPrompt("");
      setPreview(null);
      setShowConfirm(false);
      clearError();
      onOpenChange(false);
    }
  }, [isGenerating, clearError, onOpenChange]);

  const handleExampleClick = useCallback(
    (example: string) => {
      setPrompt(example);
      setPreview(null);
      setShowConfirm(false);
      clearError();
    },
    [clearError],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-1.5">
              <Sparkles className="size-4 text-violet-600" />
            </div>
            Generate Workflow with AI
          </DialogTitle>
          <DialogDescription>
            Describe the workflow you want to create and AI will generate it for
            you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Prompt input */}
          <div className="space-y-2">
            <Textarea
              id="ai-prompt"
              placeholder="E.g.: Fetch user data from the API, check if the response is valid, then save the results..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setPreview(null);
                setShowConfirm(false);
                clearError();
              }}
              disabled={isGenerating}
              className="min-h-[100px] resize-none text-sm"
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {prompt.length}/1000 characters
              </p>
              <p className="text-xs text-muted-foreground">
                ⌘+Enter to generate
              </p>
            </div>
          </div>

          {/* Example prompts */}
          {!preview && !isGenerating && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                💡 Try an example:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="rounded-md border border-dashed px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-violet-500" />
                Generating workflow...
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && !isGenerating && (
            <div className="rounded-lg border bg-emerald-50/50 border-emerald-200/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                Generated successfully
              </div>

              {/* Node list */}
              <div className="space-y-1.5">
                {preview.nodes.map((node, index) => {
                  const IconComponent = NODE_TYPE_ICONS[node.type] ?? Code;
                  return (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-xs text-muted-foreground w-4 text-right">
                        {index + 1}.
                      </span>
                      <div className="rounded bg-white border p-1">
                        <IconComponent className="size-3 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground truncate">
                        {node.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                      >
                        {NODE_TYPE_LABELS[node.type] ?? node.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Edge count */}
              {preview.edges.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                  <ArrowRight className="size-3" />
                  {preview.edges.length} connection
                  {preview.edges.length !== 1 ? "s" : ""}
                </div>
              )}

              {/* Overwrite warning */}
              {showConfirm && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800">
                  ⚠️ This will replace all existing nodes and edges in the
                  editor. Click &quot;Apply&quot; again to confirm.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>

          {!preview ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || prompt.trim().length < 10}
              className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Sparkles className="size-4" />
              {showConfirm ? "Confirm & Apply" : "Apply to Editor"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
