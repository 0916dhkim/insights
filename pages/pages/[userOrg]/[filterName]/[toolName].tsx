import { useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

import Tool from "components/organisms/ToolsDisplay/tools-display";

import HubPageLayout from "layouts/hub-page";
import { WithPageLayout } from "interfaces/with-page-layout";
import changeCapitalization from "lib/utils/change-capitalization";

interface InsightPageProps {
  insight: DbUserInsight;
  pageName: string;
}

const HubPage: WithPageLayout<InsightPageProps> = ({ insight, pageName }: InsightPageProps) => {
  const repositories = insight.repos.map((repo) => repo.repo_id);

  const title = `${insight.name} | Open Sauced Insights Hub`;

  useEffect(() => {
    HubPage.updateSEO!({
      title: title,
    });
  }, [title]);

  return <Tool tool={changeCapitalization(pageName, true)} repositories={repositories} />;
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createServerSupabaseClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const insightId = ctx.params!["filterName"] as string;
  const pageName = ctx.params!["toolName"] as string;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/insights/${insightId}`);
  const insight = response.ok ? ((await response.json()) as DbUserInsight) : null;

  if (!insight) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const userId = session?.user?.user_metadata.sub as string;
  const isOwner = !!(userId && insight && `${userId}` === `${insight.user?.id}`);

  if (insight && !insight.is_public && !isOwner) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      insight,
      pageName,
    },
  };
};

HubPage.PageLayout = HubPageLayout;

export default HubPage;
