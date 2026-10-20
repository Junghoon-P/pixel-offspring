"use client";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Invite } from "./Invite";
export const InvitePage = ({ id }: { id: string }): ReactElement => {
  const router = useRouter();
  return <Invite id={id} navigate={(path): void => router.push(path)} />;
};
