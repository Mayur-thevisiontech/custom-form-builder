import { useState, useCallback } from "react";
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
  ColorPicker,
  ButtonGroup,
  Tabs,
  Checkbox,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from "@shopify/polaris-icons";
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [submitText, setSubmitText] = useState("Submit");
  const [submitColor, setSubmitColor] = useState("#008060");
  const [submitWidth, setSubmitWidth] = useState("100");

  const tabs = [
    { id: "fields", content: "Form Fields", accessibilityLabel: "Form Fields", panelID: "fields-panel" },
    { id: "submit", content: "Submit Button", accessibilityLabel: "Submit Button", panelID: "submit-panel" },
  ];

  const handleTabChange = useCallback((selectedTabIndex) => setSelectedTab(selectedTabIndex), []);

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

  const fieldWidths = [
    { label: "100%", value: "100" },
    { label: "50%", value: "50" },
    { label: "33%", value: "33" },
  ];

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      deletable: true,
      options: [],
      width: "100",
    };
    setFields([...fields, newField]);
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newFields.length) return;
    const [movedItem] = newFields.splice(index, 1);
    newFields.splice(newIndex, 0, movedItem);
    setFields(newFields);
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

  // Helper to convert hex to hsb
  const hexToHsb = (hex) => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(s => s + s).join("");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { hue: h * 360, saturation: s, brightness: v };
  };

  // Helper to convert hsb to hex
  const hsbToHex = ({ hue, saturation, brightness }) => {
    const v = brightness;
    const s = saturation;
    const h = hue / 360;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const [colorHsb, setColorHsb] = useState(hexToHsb(submitColor));

  const handleColorChange = (hsb) => {
    setColorHsb(hsb);
    setSubmitColor(hsbToHex(hsb));
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
        settings: JSON.stringify({ submitText, submitColor, submitWidth }),
      },
      { method: "POST" }
    );
  };

  return (
    <Page
      fullWidth
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

            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Box paddingBlockStart="400">
                {selectedTab === 0 ? (
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h2">Form Fields</Text>
                      <Divider />
                      {fields.map((field, index) => (
                        <Box key={field.id} padding="400" background="bg-surface-secondary" borderRadius="200" borderWidth="025" borderColor="border">
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="200">
                                <ButtonGroup variant="segmented">
                                  <Button
                                    icon={ChevronUpIcon}
                                    onClick={() => moveField(index, -1)}
                                    disabled={index === 0}
                                  />
                                  <Button
                                    icon={ChevronDownIcon}
                                    onClick={() => moveField(index, 1)}
                                    disabled={index === fields.length - 1}
                                  />
                                </ButtonGroup>
                                <Text variant="bodyMd" fontWeight="bold">Field #{index + 1}</Text>
                              </InlineStack>
                              {field.deletable && (
                                <Button
                                  icon={DeleteIcon}
                                  tone="critical"
                                  onClick={() => removeField(field.id)}
                                />
                              )}
                            </InlineStack>

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
                              <div style={{ flex: 1 }}>
                                <Select
                                  label="Width"
                                  options={fieldWidths}
                                  value={field.width || "100"}
                                  onChange={(val) => updateField(field.id, "width", val)}
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '24px' }}>
                                <Checkbox
                                  label="Required"
                                  checked={field.required}
                                  onChange={(val) => updateField(field.id, "required", val)}
                                  disabled={!field.deletable && field.required}
                                />
                              </div>
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
                ) : (
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h2">Submit Button Customization</Text>
                      <TextField
                        label="Button Text"
                        value={submitText}
                        onChange={setSubmitText}
                        autoComplete="off"
                      />
                      <Select
                        label="Button Width"
                        options={[
                          { label: "Full Width (100%)", value: "100" },
                          { label: "Centered (Auto)", value: "auto" },
                        ]}
                        value={submitWidth}
                        onChange={setSubmitWidth}
                      />
                      <BlockStack gap="200">
                        <Text variant="bodyMd">Button Color</Text>
                        <InlineStack gap="400" blockAlign="center">
                          <ColorPicker color={colorHsb} onChange={handleColorChange} />
                          <Box padding="200" background="bg-surface-secondary" borderRadius="100" borderWidth="025" borderColor="border">
                            <Text variant="bodyMd" fontWeight="bold">{submitColor.toUpperCase()}</Text>
                          </Box>
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>
                  </Card>
                )}
              </Box>
            </Tabs>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <div style={{ position: 'sticky', top: '20px' }}>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Live Preview</Text>
                <Divider />
                <Box padding="400" background="bg-surface-tertiary" borderRadius="200" borderWidth="025" borderColor="border">
                  <Text variant="headingMd" as="h3" alignment="center">{title || "Form Preview"}</Text>
                  <Box paddingBlockStart="400">
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '12px'
                    }}>
                      {fields.map((field) => {
                        const gridSpan = field.width === '33' ? 'span 2' : field.width === '50' ? 'span 3' : 'span 6';
                        return (
                          <div key={field.id} style={{ gridColumn: gridSpan }}>
                            <BlockStack gap="100">
                              <Text variant="bodySm" fontWeight="bold">{field.label} {field.required && "*"}</Text>

                              {/* Rich Field Rendering */}
                              {field.type === "textarea" ? (
                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '60px', background: 'white' }}>
                                  <Text variant="bodySm" tone="subdued">{field.placeholder}</Text>
                                </div>
                              ) : field.type === "select" ? (
                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', background: 'white', display: 'flex', justifyContent: 'space-between' }}>
                                  <Text variant="bodySm" tone="subdued">{field.placeholder || "Select option..."}</Text>
                                  <Text variant="bodySm">▼</Text>
                                </div>
                              ) : field.type === "radio" || field.type === "checkbox" ? (
                                <BlockStack gap="100">
                                  {field.options?.map((opt, i) => (
                                    <InlineStack key={i} gap="200">
                                      <div style={{ width: '14px', height: '14px', border: '1px solid #ddd', borderRadius: field.type === 'radio' ? '50%' : '2px', background: 'white' }} />
                                      <Text variant="bodySm">{opt}</Text>
                                    </InlineStack>
                                  ))}
                                </BlockStack>
                              ) : field.type === "phone" ? (
                                <InlineStack gap="0">
                                  <div style={{ border: '1px solid #ddd', borderRight: 'none', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', padding: '8px', background: '#f9f9f9', display: 'flex', alignItems: 'center' }}>
                                    <Text variant="bodySm">🇺🇸 +1</Text>
                                  </div>
                                  <div style={{ flex: 1, border: '1px solid #ddd', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', padding: '8px', background: 'white' }}>
                                    <Text variant="bodySm" tone="subdued">Phone number</Text>
                                  </div>
                                </InlineStack>
                              ) : field.type === "file" ? (
                                <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '20px', background: 'white', textAlign: 'center' }}>
                                  <Text variant="bodySm" tone="subdued">Drop files here or click to upload</Text>
                                </div>
                              ) : (
                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', background: 'white' }}>
                                  <Text variant="bodySm" tone="subdued">{field.placeholder || `Enter ${field.label.toLowerCase()}...`}</Text>
                                </div>
                              )}

                              {field.helpText && (
                                <Text variant="bodyXs" tone="subdued">{field.helpText}</Text>
                              )}
                            </BlockStack>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{
                      marginTop: '24px',
                      display: 'flex',
                      justifyContent: submitWidth === 'auto' ? 'center' : 'stretch'
                    }}>
                      <button style={{
                        width: submitWidth === 'auto' ? 'auto' : '100%',
                        backgroundColor: submitColor,
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'default'
                      }}>
                        {submitText}
                      </button>
                    </div>
                  </Box>
                </Box>
                <Divider />
                <Text variant="bodySm" tone="subdued">
                  Tip: Use the "Submit Button" tab to change the button color and text.
                </Text>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
