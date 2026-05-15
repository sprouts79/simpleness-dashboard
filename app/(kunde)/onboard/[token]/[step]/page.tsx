import { notFound } from "next/navigation";
import { getKunde } from "@/lib/db-kunder";
import {
  getSessionByToken,
  getAccess,
  getInsights,
  getDocuments,
} from "@/lib/db-onboarding";
import Wizard from "../Wizard";

const STEP_FROM_SLUG: Record<string, 1 | 2 | 3> = {
  tilganger: 1,
  innsikt: 2,
  "veien-videre": 3,
};

interface PageProps {
  params: Promise<{ token: string; step: string }>;
}

export default async function OnboardStepPage({ params }: PageProps) {
  const { token, step: stepSlug } = await params;
  const initialStep = STEP_FROM_SLUG[stepSlug];
  if (!initialStep) notFound();

  const session = await getSessionByToken(token);
  if (!session) notFound();

  const [kunde, access, insights, documents] = await Promise.all([
    getKunde(session.client_id),
    getAccess(session.id),
    getInsights(session.id),
    getDocuments(session.id),
  ]);

  if (!kunde) notFound();

  return (
    <Wizard
      token={token}
      kundeNavn={kunde.name}
      contactName={kunde.contact_name ?? "deg"}
      simplenessKontakt={kunde.simpleness_contact ?? "Jonas"}
      slackInviteUrl={kunde.slack_invite_url}
      session={session}
      access={access}
      insights={insights}
      documents={documents}
      initialStep={initialStep}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const session = await getSessionByToken(token);
  if (!session) return { title: "Onboarding · Simpleness" };
  const kunde = await getKunde(session.client_id);
  return { title: kunde ? `${kunde.name} · Onboarding · Simpleness` : "Onboarding · Simpleness" };
}
