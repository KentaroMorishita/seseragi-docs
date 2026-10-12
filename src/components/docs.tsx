import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { Root } from "fumadocs-core/page-tree";
import type { ReactNode } from "react";
import SearchDialog from "./search";

const brand = <span className="brand"><img src="/favicon.svg" width="28" height="28" alt="" />seseragi<span className="brand-docs">docs</span></span>;
const translations = {
  "Toggle Menu(home layout header)(aria-label)": "メニューを開く",
  "Open Sidebar(sidebar)(aria-label)": "メニューを開く",
  "Close Sidebar(sidebar)(aria-label)": "メニューを閉じる",
  "Collapse Sidebar(sidebar)(aria-label)": "サイドバーを閉じる",
  "Search(search trigger)": "検索",
  "Open Search(search trigger)(aria-label)": "検索を開く",
  "Search(search dialog)": "検索",
  "Close Search(search dialog)(aria-label)": "検索を閉じる",
  "No results found(search dialog)": "見つかりませんでした",
  "On this page(table of contents)": "このページの内容",
  "Previous Page(pagination)": "前のページ",
  "Next Page(pagination)": "次のページ",
  "Copy Text(code block)(aria-label)": "コードをコピー",
  "Copied Text(code block)(aria-label)": "コピーしました",
  "Copy Anchor Link(heading anchor)(aria-label)": "見出しのリンクをコピー",
  "Copied Anchor Link(heading anchor)(aria-label)": "コピーしました",
  "Toggle Theme(theme switcher)(aria-label)": "配色を切り替える",
  "Light(theme switcher)(aria-label)": "ライト",
  "Dark(theme switcher)(aria-label)": "ダーク",
  "System(theme switcher)(aria-label)": "システム設定",
};
function layoutOptions(pathname: string) {
  const en = pathname.startsWith("/en");
  const base = en ? "/en" : "";
  return {
    nav: { title: brand, url: base || "/" },
    links: [
      { text: en ? "Learn" : "学ぶ", url: `${base}/docs/learn`, active: "nested-url" as const },
      { text: en ? "Guides" : "用途別ガイド", url: `${base}/docs/guides`, active: "nested-url" as const },
      { text: en ? "Reference" : "リファレンス", url: `${base}/docs/reference`, active: "nested-url" as const },
      { text: "Playground ↗", url: "https://seseragi.vercel.app/", external: true },
      { text: en ? "日本語" : "English", url: en ? pathname.replace(/^\/en/, "") || "/" : `/en${pathname === "/" ? "" : pathname}`, active: "none" as const },
    ],
    githubUrl: "https://github.com/KentaroMorishita/seseragi-docs",
  };
}
function Provider({ pathname, children }: { pathname: string; children: ReactNode }) {
  const en = pathname.startsWith("/en");
  return <RootProvider pathname={pathname} theme={{ defaultTheme: "dark" }} search={{ SearchDialog }} i18n={{ locale: en ? "en" : "ja", translations: en ? {} : translations }}>{children}</RootProvider>;
}
export function Home({ pathname, children }: { pathname: string; children: ReactNode }) {
  return <Provider pathname={pathname}><HomeLayout {...layoutOptions(pathname)}>{children}</HomeLayout></Provider>;
}
export function Docs({ tree, children, pathname, page }: { tree: Root; children: ReactNode; pathname: string; page?: DocsPageProps }) {
  return <Provider pathname={pathname}><DocsLayout tree={tree} {...layoutOptions(pathname)}><DocsPage {...page}>{children}</DocsPage></DocsLayout></Provider>;
}
