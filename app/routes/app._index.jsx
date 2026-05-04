import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
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
  Badge,
  Box,
  ProgressBar,
  Icon,
  TextField,
  Divider,
} from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

const CircleOutlineIcon = () => (
  <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const forms = await prisma.form.findMany({ where: { shop: session.shop } });
  
  const themeUrl = `https://${session.shop}/admin/themes/current/editor?context=apps`;

  return { forms, themeUrl };
};

export default function Index() {
  const { forms, themeUrl } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [appEnabled, setAppEnabled] = useState(true);
  const hasCreatedForm = forms.length > 0;
  
  const firstFormId = forms.length > 0 ? forms[0].id : "No form created yet";

  const completedSteps = [appEnabled, hasCreatedForm, false].filter(Boolean).length;
  const totalSteps = 3;

  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <Text variant="headingXl" as="h1">
          Hi there! 👋 Ready to create?
        </Text>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Text variant="bodyMd" fontWeight="bold">App embed status</Text>
                  {appEnabled ? (
                    <Badge tone="success">ON</Badge>
                  ) : (
                    <Badge>OFF</Badge>
                  )}
                </InlineStack>
                <Button 
                  onClick={() => {
                    setAppEnabled(!appEnabled);
                    if (!appEnabled) {
                      open(themeUrl, '_blank');
                    }
                  }}
                >
                  {appEnabled ? "Disable app" : "Enable app"}
                </Button>
              </InlineStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="bodyMd" fontWeight="bold">Theme app blocks</Text>
                <Badge tone="info">0 active app blocks</Badge>
              </InlineStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">Get started</Text>
                </InlineStack>
                <Text variant="bodyMd">
                  Follow these steps to set up and add your first form to your store.
                </Text>

                <InlineStack gap="300" blockAlign="center">
                  <div style={{ flex: 1 }}>
                    <ProgressBar progress={(completedSteps / totalSteps) * 100} size="small" tone="success" />
                  </div>
                  <Text variant="bodySm" tone="subdued">{completedSteps} / {totalSteps} completed</Text>
                </InlineStack>

                <Box paddingBlockStart="200">
                  <BlockStack gap="0">
                    {/* Step 1 */}
                    <Box padding="300">
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{ color: appEnabled ? '#008060' : '#8c9196', width: '20px', height: '20px' }}>
                          <Icon source={appEnabled ? CheckCircleIcon : CircleOutlineIcon} />
                        </div>
                        <BlockStack gap="200">
                          <Text variant="headingSm" as="h3">Enable the app</Text>
                          {!appEnabled && (
                            <Button onClick={() => open(themeUrl, '_blank')}>Enable App in Theme</Button>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </Box>
                    <Divider />

                    {/* Step 2 */}
                    <Box padding="300">
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{ color: hasCreatedForm ? '#008060' : '#8c9196', width: '20px', height: '20px' }}>
                          <Icon source={hasCreatedForm ? CheckCircleIcon : CircleOutlineIcon} />
                        </div>
                        <BlockStack gap="200">
                          <Text variant="headingSm" as="h3">Create form</Text>
                          {!hasCreatedForm && (
                            <Button variant="primary" onClick={() => navigate('/app/forms/new')}>Create New Form</Button>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </Box>
                    <Divider />

                    {/* Step 3 */}
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{ color: '#8c9196', width: '20px', height: '20px' }}>
                          <Icon source={CircleOutlineIcon} />
                        </div>
                        <BlockStack gap="400">
                          <Text variant="headingSm" as="h3">Add the form to your store</Text>
                          
                          <InlineStack gap="400" align="space-between" blockAlign="start">
                            <div style={{ flex: 1 }}>
                              <Text variant="bodyMd">
                                In your Theme Editor, add the form as an App block, or paste its shortcode on the page where you want it to appear.
                              </Text>
                              <Box paddingBlockStart="300">
                                <Button variant="primary" onClick={() => open(themeUrl, '_blank')}>Add to store</Button>
                              </Box>
                            </div>

                            <div style={{ flex: 1, maxWidth: '400px' }}>
                              <Card background="bg-surface">
                                <BlockStack gap="200">
                                  <Text variant="bodySm" tone="subdued">Form ID</Text>
                                  <TextField 
                                    value={firstFormId} 
                                    readOnly 
                                    autoComplete="off" 
                                    onFocus={(e) => e.target.select()}
                                    helpText="Copy this ID to use in your Theme App Block"
                                  />
                                </BlockStack>
                              </Card>
                            </div>
                          </InlineStack>
                        </BlockStack>
                      </InlineStack>
                    </Box>

                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
