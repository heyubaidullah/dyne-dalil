export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({
    success: true,
    data: {
      mode: "no-op",
      message:
        "Embeddings are no longer required. Similar-signal recall runs through Dalil AI at query time.",
    },
  });
}
