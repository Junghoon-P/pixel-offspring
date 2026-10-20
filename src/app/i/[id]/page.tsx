import type { ReactElement } from "react";
import { InvitePage } from "../../../features/InvitePage";
const Page = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> => <InvitePage id={(await params).id} />;
export default Page;
