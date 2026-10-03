import { identity, json, failure } from "@/lib/find-server/http";
import { getFindStore } from "@/lib/find-server/store";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const who = identity(request);
    const { id } = await context.params;
    const store = getFindStore();
    await store.read(id, who.owner);
    await store.expirePending(id);
    return json(await store.read(id, who.owner));
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const who = identity(request);
    await getFindStore().cancel((await context.params).id, who.owner);
    return json({ cancelled: true });
  } catch (e) {
    return failure(e);
  }
}
