import { AppShell } from "@/components/app-shell";
import { WorkspaceClient } from "@/components/workspace-client";
import { getAIProviderLabel } from "@/lib/ai/provider";
import { getWorkspaceMaterials } from "@/lib/workspace-materials";

export const dynamic = "force-dynamic";

export default async function Home() {
  const aiProviderLabel = getAIProviderLabel();
  const materials = await getWorkspaceMaterials();

  return (
    <AppShell currentPath="/">
      <WorkspaceClient aiProviderLabel={aiProviderLabel} initialMaterials={materials} />
    </AppShell>
  );
}
