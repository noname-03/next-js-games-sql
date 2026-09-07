import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BattleRoom from "@/components/BattleRoom";

export const dynamic = "force-dynamic";

export default async function BattleRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ exerciseId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { exerciseId } = await searchParams;

  return (
    <BattleRoom
      battleId={id}
      userId={user.id}
      username={user.username}
      displayName={user.displayName}
      exerciseId={exerciseId ? parseInt(exerciseId, 10) : undefined}
    />
  );
}
