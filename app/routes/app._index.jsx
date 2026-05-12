import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  Badge,
  Icon,
} from "@shopify/polaris";

import {
  CheckCircleIcon,
  AlertBubbleIcon,
  MagicIcon,
} from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const forms = await prisma.form.findMany({
    where: { shop: session.shop },
  });

  let appEnabled = false;

  try {
    const themesRes = await admin.rest.get({ path: "themes" });
    const themes = themesRes.data?.themes || [];
    const sortedThemes = [...themes].sort((a, b) => (b.role === "main" ? 1 : -1));

    for (const theme of sortedThemes) {
      if (appEnabled) break;

      const [assetRes, indexRes] = await Promise.all([
        admin.rest.get({ path: `themes/${theme.id}/assets`, query: { "asset[key]": "config/settings_data.json" } }),
        admin.rest.get({ path: `themes/${theme.id}/assets`, query: { "asset[key]": "templates/index.json" } }).catch(() => ({ data: { asset: { value: "" } } }))
      ]);

      const settingsRaw = assetRes.data?.asset?.value || "";
      const indexRaw = indexRes.data?.asset?.value || "";

      const checkContent = (raw) => {
        if (!raw) return false;
        if (raw.includes("8f596786") || raw.includes("64b50aa7")) {
          try {
            const data = JSON.parse(raw);
            const everything = [
              ...(data?.current?.blocks ? Object.values(data.current.blocks) : []),
              ...Object.values(data?.sections || {}),
              ...Object.values(data?.sections || {}).flatMap(s => s.blocks ? Object.values(s.blocks) : [])
            ];
            const found = everything.find(i => (String(i.type).includes("8f596786") || String(i.type).includes("64b50aa7") || String(i.type).includes("form")));
            return found && found.disabled !== true;
          } catch(e) { return true; }
        }
        return false;
      };

      appEnabled = checkContent(settingsRaw) || checkContent(indexRaw);

      if (!appEnabled) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        appEnabled = forms.some(f => f.lastSeenAt && new Date(f.lastSeenAt) > oneDayAgo);
      }
    }
  } catch (error) {
    console.error("Theme status check failed:", error);
  }

  const shopDomain = session.shop.replace("https://", "").replace("http://", "");
  const themeUrl = `https://${shopDomain}/admin/themes/current/editor?context=apps`;

  return { forms, themeUrl, appEnabled };
};

export default function Index() {
  const { forms, themeUrl, appEnabled } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!appEnabled) {
      const interval = setInterval(() => {
        if (revalidator.state === "idle") {
          setIsSyncing(true);
          revalidator.revalidate();
        }
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setIsSyncing(false);
    }
  }, [appEnabled, revalidator]);

  const hasCreatedForm = forms.length > 0;

  return (
    <Page fullWidth>
      <style>{`
        @keyframes pulse-ring { 0% { transform: scale(.33); } 80%, 100% { opacity: 0; } }
        @keyframes pulse-dot { 0% { transform: scale(.8); } 50% { transform: scale(1); } 100% { transform: scale(.8); } }
        .status-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: ${appEnabled ? "linear-gradient(135deg, #008060 0%, #005e46 100%)" : "linear-gradient(135deg, #FFC966 0%, #F5A623 100%)"};
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border-radius: 16px; padding: 24px; color: white;
        }
        .setup-card { border-left: 4px solid #5C6AC4; transition: transform 0.2s; }
        .setup-card:hover { transform: translateY(-2px); }
      `}</style>

      <BlockStack gap="600">
        <div className="status-card">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="400" blockAlign="start">
              <div style={{ position: "relative", width: "24px", height: "24px", marginTop: "4px" }}>
                {isSyncing && !appEnabled && (
                  <div style={{ position: "absolute", width: "44px", height: "44px", top: "-10px", left: "-10px", borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite" }} />
                )}
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "white", animation: "pulse-dot 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite" }} />
              </div>
              <BlockStack gap="100">
                <Text variant="headingLg" as="h2" color="inherit">{appEnabled ? "Connection Secured" : "Awaiting Integration"}</Text>
                <Text variant="bodyLg" color="inherit">{appEnabled ? "Great! Your form builder is successfully linked to your storefront." : "We're currently searching for your app in the theme settings..."}</Text>
              </BlockStack>
            </InlineStack>
            {!appEnabled ? (
              <Button size="large" onClick={() => window.shopify ? window.shopify.open(themeUrl, "_top") : window.open(themeUrl, "_blank")}>Open Theme Editor</Button>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px 24px", borderRadius: "30px", backdropFilter: "blur(10px)" }}>
                <Text variant="bodyMd" fontWeight="bold">Active</Text>
              </div>
            )}
          </InlineStack>
        </div>

        <Layout>
          <Layout.Section variant="oneHalf">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Quick Actions</Text>
              <Card>
                <div className="setup-card" style={{ padding: "24px" }}>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text variant="headingSm" as="h3">Designer Tool</Text>
                      <Text variant="bodyMd" tone="subdued">Launch the visual form builder to edit your fields.</Text>
                    </BlockStack>
                    <Button variant="primary" onClick={() => navigate("/app/forms/new")}>
                      <InlineStack gap="200"><Icon source={MagicIcon} /><Text variant="bodyMd">Create Form</Text></InlineStack>
                    </Button>
                  </InlineStack>
                </div>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Installation Progress</Text>
              <Card><Box padding="500"><BlockStack gap="400">
                <InlineStack gap="300" blockAlign="center">
                  <div style={{ width: "20px" }}><Icon source={appEnabled ? CheckCircleIcon : AlertBubbleIcon} tone={appEnabled ? "success" : "caution"} /></div>
                  <Text variant="bodyMd" fontWeight={appEnabled ? "bold" : "regular"}>Enable App Embed</Text>
                </InlineStack>
                <InlineStack gap="300" blockAlign="center">
                  <div style={{ width: "20px" }}><Icon source={hasCreatedForm ? CheckCircleIcon : AlertBubbleIcon} tone={hasCreatedForm ? "success" : "caution"} /></div>
                  <Text variant="bodyMd" fontWeight={hasCreatedForm ? "bold" : "regular"}>Create Your First Form</Text>
                </InlineStack>
              </BlockStack></Box></Card>
            </BlockStack>
          </Layout.Section>

          {hasCreatedForm && (
            <Layout.Section>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Your Forms</Text>
                <Layout>
                  {forms.map((form) => (
                    <Layout.Section key={form.id} variant="oneThird">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingSm" as="h3">{form.title}</Text>
                          <Text variant="bodySm" tone="subdued">Last modified: {new Date(form.updatedAt).toLocaleDateString()}</Text>
                          <div style={{ background: "#f4f6f8", border: "1px solid #e1e3e5", borderRadius: "6px", padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <div style={{ overflow: "hidden" }}>
                              <Text variant="bodySm" tone="subdued">Form ID:</Text>
                              <code style={{ fontSize: "11px", wordBreak: "break-all", color: "#202223" }}>{form.id}</code>
                            </div>
                            <Button size="slim" onClick={() => navigator.clipboard.writeText(form.id)}>Copy</Button>
                          </div>
                          <InlineStack align="space-between">
                            <Button variant="plain" onClick={() => navigate(`/app/forms/${form.id}`)}>Edit</Button>
                            <Badge tone="success">Live</Badge>
                          </InlineStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  ))}
                </Layout>
              </BlockStack>
            </Layout.Section>
          )}
        </Layout>
      </BlockStack>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
