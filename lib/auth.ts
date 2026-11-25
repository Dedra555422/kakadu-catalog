import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.id) return false;
      await prisma.user.upsert({
        where: { discordId: String(profile.id) },
        update: {
          username: String(profile.username ?? "unknown"),
          avatar: profile.avatar ? String(profile.avatar) : null,
          lastLogin: new Date(),
        },
        create: {
          discordId: String(profile.id),
          username: String(profile.username ?? "unknown"),
          avatar: profile.avatar ? String(profile.avatar) : null,
          lastLogin: new Date(),
        },
      });
      return true;
    },
    async jwt({ token, profile }) {
      const discordId = profile?.id ? String(profile.id) : (token.discordId as string | undefined);
      if (discordId) {
        token.discordId = discordId;
        const dbUser = await prisma.user.findUnique({ where: { discordId } });
        if (dbUser) {
          token.uid = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).uid = token.uid;
      (session as any).discordId = token.discordId;
      (session as any).role = token.role;
      (session as any).status = token.status;
      return session;
    },
  },
};
