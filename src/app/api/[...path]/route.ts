import app, { errorResponse } from "../../../../worker/index";
import { runtimeEnvironment } from "../../../../worker/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const handle = async (request: Request): Promise<Response> => {
  try {
    return await app.fetch(request, await runtimeEnvironment());
  } catch (error) {
    return errorResponse(error);
  }
};
export { handle as GET, handle as POST, handle as DELETE };
