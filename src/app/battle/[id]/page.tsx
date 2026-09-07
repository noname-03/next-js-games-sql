import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BattleRoom from "@/components/BattleRoom";

export const dynamic = "force-dynamic";

export default async function BattleRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <BattleRoom
      battleId={id}
      userId={user.id}
      username={user.username}
      displayName={user.displayName}
    />
  );
}
