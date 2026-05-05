import { useCallback } from "react";
import EditorImport from "react-simple-code-editor";
import Prism from "prismjs";

// CJS/ESM interop: the default export may be wrapped in { default: ... }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Editor = ((EditorImport as any).default ?? EditorImport) as typeof EditorImport;
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "./code-editor.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CodeEditorProps {
  /** Current source text */
  value: string;
  /** Callback when text changes */
  onChange: (value: string) => void;
  /** Prism language key used for highlighting */
  language?: "json" | "javascript" | "python" | "bash";
  /** Placeholder shown when the editor is empty */
  placeholder?: string;
  /** Minimum visible lines (maps to min-height) */
  minLines?: number;
  /** Maximum visible lines before scrolling */
  maxLines?: number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a language key to the Prism grammar object */
function getGrammar(lang: CodeEditorProps["language"]) {
  switch (lang) {
    case "json":
      return Prism.languages.json;
    case "python":
      return Prism.languages.python;
    case "bash":
      return Prism.languages.bash;
    case "javascript":
    default:
      return Prism.languages.javascript;
  }
}

/** Pretty label for the language badge */
function getLangLabel(lang: CodeEditorProps["language"]) {
  switch (lang) {
    case "json":
      return "JSON";
    case "python":
      return "Python";
    case "bash":
      return "Shell";
    case "javascript":
    default:
      return "JS";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  placeholder,
  minLines = 3,
  maxLines = 12,
  readOnly = false,
}: CodeEditorProps) {
  const highlight = useCallback(
    (code: string) =>
      Prism.highlight(code, getGrammar(language), language ?? "javascript"),
    [language],
  );

  const minH = minLines * 19.2 + 24; // line-height ~19.2px + vertical padding
  const maxH = maxLines * 19.2 + 24;

  return (
    <div className="code-editor-wrapper">
      <span className="code-editor-lang">{getLangLabel(language)}</span>
      <div
        style={{
          minHeight: `${minH}px`,
          maxHeight: `${maxH}px`,
          overflow: "auto",
        }}
      >
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlight}
          placeholder={placeholder}
          readOnly={readOnly}
          className="code-editor-root"
          textareaClassName="focus:outline-none"
          style={{
            minHeight: `${minH}px`,
          }}
        />
      </div>
    </div>
  );
}
