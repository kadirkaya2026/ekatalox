import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Giriş",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const target = Array.isArray(searchParams.next)
    ? searchParams.next[0]
    : searchParams.next;

  return <LoginForm target={target} />;
}