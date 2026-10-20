import { localDatabase, usesLocalDatabase } from "../../../../../worker/local";
import { errorResponse } from "../../../../../worker/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = async (request: Request): Promise<Response> => {
  const token = process.env.E2E_DB_TOKEN;
  if (
    !usesLocalDatabase() ||
    !token ||
    request.headers.get("Authorization") !== `Bearer ${token}`
  )
    return new Response(null, { status: 404 });
  try {
    const body = await request.text();
    if (body.length > 1024 * 1024) return new Response(null, { status: 413 });
    return Response.json(await (await localDatabase()).pg.exec(body));
  } catch (error) {
    return errorResponse(error);
  }
};
