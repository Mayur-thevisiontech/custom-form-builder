import { useState } from "react";
import { redirect } from "react-router";
import { useFetcher, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Divider,
  Icon,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = formData.get("title");
  const schema = JSON.parse(formData.get("schema"));
  const settings = JSON.parse(formData.get("settings"));

  const form = await prisma.form.create({
    data: {
      shop: session.shop,
      title,
      handle: title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      schema,
      settings,
    },
  });

  return redirect(`/app/forms`);
};

const DEFAULT_FIELDS = [
  { id: "first_name", type: "text", label: "First Name", required: true, deletable: false },
  { id: "email", type: "email", label: "Email", required: true, deletable: false },
];

export default function NewForm() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [submitText, setSubmitText] = useState("Submit");
  const [submitColor, setSubmitColor] = useState("#008060");

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      deletable: true,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id, key, value) => {
    setFields(
      fields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const handleSave = () => {
    if (!title) {
      alert("Please provide a form name");
      return;
    }
    fetcher.submit(
      {
        title,
        schema: JSON.stringify(fields),
        settings: JSON.stringify({ submitText, submitColor }),
      },
      { method: "POST" }
    );
  };

  return (
    <Page
      title="Create new form"
      backAction={{ content: "Forms", url: "/app/forms" }}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        loading: fetcher.state === "submitting",
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <TextField
                label="Form Name"
                value={title}
                onChange={setTitle}
                autoComplete="off"
                placeholder="e.g. Contact Us"
              />
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Form Fields</Text>
                <Divider />
                {fields.map((field, index) => (
                  <Box key={field.id} padding="200" background="bg-surface-secondary" borderRadius="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <TextField
                          label={`Field Label (${field.type})`}
                          value={field.label}
                          onChange={(val) => updateField(field.id, "label", val)}
                          autoComplete="off"
                        />
                      </div>
                      {field.deletable && (
                        <Button
                          icon={DeleteIcon}
                          tone="critical"
                          onClick={() => removeField(field.id)}
                        />
                      )}
                    </InlineStack>
                  </Box>
                ))}
                <Button icon={PlusIcon} onClick={addField}>Add Field</Button>
              </BlockStack>
            </Card>

            <Card title="Submit Button">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Submit Button Customization</Text>
                <TextField
                  label="Button Text"
                  value={submitText}
                  onChange={setSubmitText}
                  autoComplete="off"
                />
                <TextField
                  label="Button Color (Hex Code)"
                  value={submitColor}
                  onChange={setSubmitColor}
                  autoComplete="off"
                  placeholder="#008060"
                />
                <div style={{ marginTop: '10px' }}>
                  <Text variant="bodySm">Preview:</Text>
                  <button
                    style={{
                      backgroundColor: submitColor,
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'default',
                      marginTop: '5px'
                    }}
                  >
                    {submitText}
                  </button>
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">Help</Text>
              <Text variant="bodyMd">
                Forms must include First Name and Email as mandatory fields. These cannot be removed.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
