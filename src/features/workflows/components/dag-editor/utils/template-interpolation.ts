// ---------------------------------------------------------------------------
// Template interpolation — @{{ Variable }} syntax
// ---------------------------------------------------------------------------

export function interpolateTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  // Regex matches @{{ VarName }} or @{{VarName.path}}
  return template.replace(/@\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    try {
       
      const fn = new Function("variables", `return variables.${path}`);
      const val = fn(variables);
      return val !== undefined && val !== null ? String(val) : "";
    } catch {
      return `@{{${path}}}`;
    }
  });
}

/**
 * Like interpolateTemplate, but outputs JSON-safe literals so the result
 * can be embedded inside a JavaScript expression.
 *   @{{Name}} where Name="Emily"  →  "Emily"  (quoted)
 *   @{{Count}} where Count=42      →  42       (raw number)
 */
export function interpolateExpression(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(/@\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    try {
       
      const fn = new Function("variables", `return variables.${path}`);
      const val = fn(variables);
      // Use JSON.stringify so strings get properly quoted
      return val !== undefined && val !== null ? JSON.stringify(val) : "null";
    } catch {
      return "undefined";
    }
  });
}
