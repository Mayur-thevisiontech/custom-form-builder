import { useState } from "react";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useFetcher, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  TextField,
  Select,
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
  { id: "last_name", type: "text", label: "Last Name", required: false, deletable: false },
  { id: "email", type: "email", label: "Email", required: true, deletable: false },

];

export default function NewForm() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [submitText, setSubmitText] = useState("Submit");
  const [submitColor, setSubmitColor] = useState("#008060");

  const fieldTypes = [
    { label: "Text", value: "text" },
    { label: "Email", value: "email" },
    { label: "Textarea", value: "textarea" },
    { label: "Checkbox", value: "checkbox" },
    { label: "Radio", value: "radio" },
    { label: "Dropdown", value: "select" },
    { label: "File Upload", value: "file" },
    { label: "Phone", value: "phone" },
  ];

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      deletable: true,
      options: [],
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

  const addOption = (fieldId) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId) {
          return { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] };
        }
        return f;
      })
    );
  };

  const updateOption = (fieldId, index, value) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId) {
          const newOptions = [...f.options];
          newOptions[index] = value;
          return { ...f, options: newOptions };
        }
        return f;
      })
    );
  };

  const removeOption = (fieldId, index) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId) {
          return { ...f, options: f.options.filter((_, i) => i !== index) };
        }
        return f;
      })
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
                {fields.map((field) => (
                  <Box key={field.id} padding="400" background="bg-surface-secondary" borderRadius="200" borderWidth="025" borderColor="border">
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <div style={{ flex: 1, marginRight: '16px' }}>
                          <InlineStack gap="300">
                            <div style={{ flex: 2 }}>
                              <TextField
                                label="Field Label"
                                value={field.label}
                                onChange={(val) => updateField(field.id, "label", val)}
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Select
                                label="Type"
                                options={fieldTypes}
                                value={field.type}
                                onChange={(val) => updateField(field.id, "type", val)}
                                disabled={!field.deletable}
                              />
                            </div>
                          </InlineStack>
                        </div>
                        {field.deletable && (
                          <Button
                            icon={DeleteIcon}
                            tone="critical"
                            onClick={() => removeField(field.id)}
                          />
                        )}
                      </InlineStack>

                      <InlineStack gap="300">
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Placeholder"
                            value={field.placeholder || ""}
                            onChange={(val) => updateField(field.id, "placeholder", val)}
                            autoComplete="off"
                            placeholder="e.g. Enter your name"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Help Text (Small information)"
                            value={field.helpText || ""}
                            onChange={(val) => updateField(field.id, "helpText", val)}
                            autoComplete="off"
                            placeholder="e.g. We'll never share your email."
                          />
                        </div>
                      </InlineStack>

                      {["radio", "select", "checkbox"].includes(field.type) && (
                        <Box paddingBlockStart="200">
                          <BlockStack gap="200">
                            <Text variant="bodySm" fontWeight="bold">Options</Text>
                            {field.options?.map((option, idx) => (
                              <InlineStack key={idx} gap="200" align="start">
                                <div style={{ flex: 1 }}>
                                  <TextField
                                    value={option}
                                    onChange={(val) => updateOption(field.id, idx, val)}
                                    autoComplete="off"
                                    placeholder={`Option ${idx + 1}`}
                                  />
                                </div>
                                <Button
                                  icon={DeleteIcon}
                                  onClick={() => removeOption(field.id, idx)}
                                  variant="plain"
                                />
                              </InlineStack>
                            ))}
                            <Button variant="plain" onClick={() => addOption(field.id)}>Add Option</Button>
                          </BlockStack>
                        </Box>
                      )}
                    </BlockStack>
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

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
