import { useLoaderData, Link, useFetcher } from "react-router";
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Button, EmptyState } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const forms = await prisma.form.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  return { forms };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id");

  if (request.method === "DELETE" && id) {
    await prisma.form.delete({
      where: { id: String(id) },
    });
    return { success: true };
  }

  return { success: false };
};

export default function FormsIndex() {
  const { forms } = useLoaderData();
  const fetcher = useFetcher();

  const emptyStateMarkup = !forms.length ? (
    <EmptyState
      heading="Create your first form"
      action={{
        content: "Create form",
        url: "/app/forms/new",
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Manage your custom storefront forms here.</p>
    </EmptyState>
  ) : null;

  return (
    <Page
      title="Forms"
      primaryAction={{
        content: "Create form",
        url: "/app/forms/new",
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {emptyStateMarkup || (
              <ResourceList
                resourceName={{ singular: "form", plural: "forms" }}
                items={forms}
                renderItem={(item) => {
                  const { id, title, createdAt } = item;
                  return (
                    <ResourceItem
                      id={id}
                      url={`/app/forms/${id}`}
                      accessibilityLabel={`View details for ${title}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {title}
                          </Text>
                          <div>{new Date(createdAt).toLocaleDateString()}</div>
                        </div>
                        <Button
                          tone="critical"
                          variant="tertiary"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm("Are you sure?")) {
                              fetcher.submit({ id }, { method: "DELETE" });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
