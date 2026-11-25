import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const discordId = (session.user as any).discordId;
  const user = discordId
    ? await prisma.user.findUnique({ where: { discordId } })
    : null;

  if (!user || user.status !== "APPROVED") redirect("/pending");
  redirect("/vault");
}
