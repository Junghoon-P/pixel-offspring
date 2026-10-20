import type { ReactElement } from "react";
import { Result } from "../../../features/Result";
export const dynamic = "force-dynamic";
const Page = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> => (
  <Result key={(await params).id} id={(await params).id} />
);
export default Page;
