import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "../lib/store";
import { BottomNav } from "../components/BottomNav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <h1 className="text-5xl font-bold text-gradient">404</h1>
        <p className="mt-3 text-muted-foreground">الصفحة غير موجودة</p>
        <a href="/" className="mt-5 inline-block bg-primary text-primary-foreground rounded-xl px-4 py-2.5 font-semibold">العودة للرئيسية</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <h1 className="text-xl font-semibold">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول مرة أخرى</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 font-semibold">إعادة المحاولة</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "money-talk" },
      { name: "description", content: "مركز القيادة المالية الشخصي — تتبع راتبك والتزاماتك وديونك" },
      { name: "theme-color", content: "#0a0e1a" },
      { property: "og:title", content: "money-talk" },
      { name: "twitter:title", content: "money-talk" },
      { property: "og:description", content: "مركز القيادة المالية الشخصي — تتبع راتبك والتزاماتك وديونك" },
      { name: "twitter:description", content: "مركز القيادة المالية الشخصي — تتبع راتبك والتزاماتك وديونك" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9cd039f2-8c95-4eb3-9a95-6e6e891a7fce/id-preview-cff5e407--618ba9a8-4755-4fb0-8ae4-3e71512a5d26.lovable.app-1782183017265.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9cd039f2-8c95-4eb3-9a95-6e6e891a7fce/id-preview-cff5e407--618ba9a8-4755-4fb0-8ae4-3e71512a5d26.lovable.app-1782183017265.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <div className="mx-auto max-w-md min-h-screen relative">
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-60"
               style={{ background: "radial-gradient(60% 40% at 50% 0%, oklch(0.35 0.15 260 / 0.4), transparent), radial-gradient(40% 30% at 100% 100%, oklch(0.35 0.15 180 / 0.25), transparent)" }} />
          <Outlet />
          <BottomNav />
        </div>
      </StoreProvider>
    </QueryClientProvider>
  );
}
