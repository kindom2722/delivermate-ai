import { AppShell } from "@/components/app-shell";
import { KnowledgeBaseClient } from "@/components/knowledge-base-client";
import { getWorkspaceMaterials } from "@/lib/workspace-materials";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const materials = await getWorkspaceMaterials();

  return (
    <AppShell currentPath="/knowledge">
      <KnowledgeBaseClient initialMaterials={materials} />
    </AppShell>
  );
}
