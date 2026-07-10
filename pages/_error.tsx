import type { NextPageContext } from "next";

type ErrorPageProps = {
  statusCode?: number;
};

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main style={{ padding: "48px 24px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>Something went wrong</h1>
      <p style={{ marginTop: "12px", fontSize: "16px", lineHeight: 1.5, opacity: 0.75 }}>
        {statusCode ? `Status code: ${statusCode}` : "An unexpected error occurred."}
      </p>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};
