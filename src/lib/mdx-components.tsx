import defaultComponents from "fumadocs-ui/mdx";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { createElement, type ComponentProps, type HTMLAttributes } from "react";

// MDX is rendered as static HTML inside the layout island. Its small copy
// interaction is handled by layout.astro, so it does not rely on React hydration.
export function mdxComponents(lang: "ja" | "en") {
  function Code(props: ComponentProps<typeof CodeBlock>) {
    return <CodeBlock {...props} allowCopy={false} Actions={({ className }) => <div className={className}><button type="button" data-docs-copy hidden aria-live="polite" className="docs-copy">{lang === "ja" ? "コードをコピー" : "Copy code"}</button></div>}><Pre>{props.children}</Pre></CodeBlock>;
  }
  const heading = (level: 1 | 2 | 3 | 4 | 5 | 6) => (props: HTMLAttributes<HTMLHeadingElement>) => createElement(`h${level}`, { ...props, className: "scroll-m-24" }, props.id ? <a href={`#${props.id}`}>{props.children}</a> : props.children);
  return { ...defaultComponents, pre: Code, h1: heading(1), h2: heading(2), h3: heading(3), h4: heading(4), h5: heading(5), h6: heading(6) };
}
