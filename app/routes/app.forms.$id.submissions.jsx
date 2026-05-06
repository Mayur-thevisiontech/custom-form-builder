import { useLoaderData, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Badge,
  EmptyState,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { ChevronLeftIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  const form = await prisma.form.findUnique({
    where: { id },
  });

  if (!form || form.shop !== session.shop) {
    throw new Response("Not Found", { status: 404 });
  }

  const submissions = await prisma.submission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
  });

  return { form, submissions };
};

export default function FormSubmissions() {
  const { form, submissions } = useLoaderData();
  const navigate = useNavigate();

  const resourceName = {
    singular: "submission",
    plural: "submissions",
  };

  const safeParse = (data) => {
    if (typeof data === "string") {
      try { return JSON.parse(data); } catch (e) { return {}; }
    }
    return data || {};
  };

  const schema = safeParse(form.schema);
  const fieldMap = (Array.isArray(schema) ? schema : []).reduce((acc, field) => {
    acc[field.id] = field.label;
    return acc;
  }, {});

  const headings = [
    { title: "Date" },
    ...(Array.isArray(schema) ? schema : []).map((field) => ({ title: field.label })),
  ];

  const rowMarkup = submissions.map(
    ({ id, data, createdAt }, index) => {
      const parsedData = safeParse(data);
      const date = new Date(createdAt).toLocaleString();
      
      return (
        <IndexTable.Row id={id} key={id} position={index}>
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold">
              {date}
            </Text>
          </IndexTable.Cell>
          {(Array.isArray(schema) ? schema : []).map((field) => (
            <IndexTable.Cell key={field.id}>
              {String(parsedData[field.id] || "-")}
            </IndexTable.Cell>
          ))}
        </IndexTable.Row>
      );
    }
  );

  return (
    <Page
      title={`Submissions: ${form.title}`}
      backAction={{ content: "Forms", onAction: () => navigate("/app/forms") }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {submissions.length === 0 ? (
              <EmptyState
                heading="No submissions yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>When customers fill out your form, their submissions will appear here.</p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={submissions.length}
                headings={headings}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
