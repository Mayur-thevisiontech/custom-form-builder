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
  Tooltip,
  Modal,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon, DragHandleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  { id: "first_name", type: "text", label: "First Name", required: true, deletable: false, width: "50" },
  { id: "email", type: "email", label: "Email", required: true, deletable: false, width: "100" },
];

function SortableField({ field, index, updateField, removeField, addOption, updateOption, removeOption, fieldTypes, fieldWidths }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Box padding="400" background={isDragging ? "bg-surface-active" : "bg-surface-secondary"} borderRadius="200" borderWidth="025" borderColor="border" shadow={isDragging ? "300" : "100"}>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="center">
              <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                <Tooltip content="Drag to reorder">
                  <Icon source={DragHandleIcon} tone="subdued" />
                </Tooltip>
              </div>
              <Text variant="headingSm" as="h3">Field #{index + 1}</Text>
            </InlineStack>
            {field.deletable && (
              <Button
                icon={DeleteIcon}
                tone="critical"
                variant="plain"
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
            <Box paddingBlockStart="200" paddingBlockEnd="100">
              <Card background="bg-surface-tertiary">
                <BlockStack gap="300">
                  <Text variant="headingXs" fontWeight="bold">Options Configuration</Text>
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
                  <InlineStack>
                    <Button size="micro" icon={PlusIcon} onClick={() => addOption(field.id)}>Add Option</Button>
                  </InlineStack>

                  {["radio", "select"].includes(field.type) && field.options?.length > 0 && (
                    <div style={{ maxWidth: '250px' }}>
                      <Select
                        label="Default Value"
                        options={[
                          { label: "-- No Default --", value: "" },
                          ...(field.options || []).map((opt) => ({ label: opt, value: opt })),
                        ]}
                        value={field.defaultValue || ""}
                        onChange={(val) => updateField(field.id, "defaultValue", val)}
                      />
                    </div>
                  )}
                </BlockStack>
              </Card>
            </Box>
          )}
        </BlockStack>
      </Box>
    </div>
  );
}

export default function NewForm() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [submitText, setSubmitText] = useState("Submit");
  const [submitColor, setSubmitColor] = useState("#008060");
  const [submitWidth, setSubmitWidth] = useState("100");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tabs = [
    { id: "fields", content: "Form Fields", accessibilityLabel: "Form Fields", panelID: "fields-panel" },
    { id: "submit", content: "Submit Button", accessibilityLabel: "Submit Button", panelID: "submit-panel" },
  ];

  const handleTabChange = useCallback((selectedTabIndex) => setSelectedTab(selectedTabIndex), []);

  const fieldTypes = [
    { 
      label: "Text", 
      value: "text", 
      description: "Single line text input",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M3 5.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5z" clipRule="evenodd" /></svg>
    },
    { 
      label: "Email", 
      value: "email", 
      description: "Validates email address",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118z" /></svg>
    },
    { 
      label: "Textarea", 
      value: "textarea", 
      description: "Multi-line text input",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm2 1.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" clipRule="evenodd" /></svg>
    },
    { 
      label: "Checkbox", 
      value: "checkbox", 
      description: "Multiple choice (can select many)",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M16 4H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM8.293 13.707a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 1.414-1.414L7.586 11.586l6.707-6.707a1 1 0 0 1 1.414 1.414l-7.414 7.414z" clipRule="evenodd" /></svg>
    },
    { 
      label: "Radio", 
      value: "radio", 
      description: "Multiple choice (select one)",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clipRule="evenodd" /></svg>
    },
    { 
      label: "Dropdown", 
      value: "select", 
      description: "Select from a dropdown list",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm2 2v2h10V6H5zm0 4v2h6v-2H5zm0 4v2h10v-2H5z" clipRule="evenodd" /></svg>
    },
    { 
      label: "File Upload", 
      value: "file", 
      description: "Upload an attachment",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.414A2 2 0 0 0 15.414 6L12 2.586A2 2 0 0 0 10.586 2H6zm5 6a1 1 0 1 0-2 0v3.586l-1.293-1.293a1 1 0 1 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l3-3a1 1 0 0 0-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
    },
    { 
      label: "Phone", 
      value: "phone", 
      description: "Phone number with country code",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path d="M2 3a1 1 0 0 1 1-1h2.153a1 1 0 0 1 .986.836l.74 4.438a1 1 0 0 1-.328.931L4.85 9.77a13.013 13.013 0 0 0 5.38 5.38l1.564-1.701a1 1 0 0 1 .93-.327l4.438.74a1 1 0 0 1 .836.986V17a1 1 0 0 1-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
    },
  ];

  const fieldWidths = [
    { label: "100%", value: "100" },
    { label: "50%", value: "50" },
    { label: "33%", value: "33" },
  ];

  const addField = (type = "text", label = "New Field") => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label,
      required: false,
      deletable: true,
      options: ["radio", "select", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : [],
      width: "100",
    };
    setFields([...fields, newField]);
    setIsAddFieldModalOpen(false);
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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingMd" as="h2">Form Fields</Text>
                        <Button icon={PlusIcon} onClick={() => setIsAddFieldModalOpen(true)} variant="primary">Add Field</Button>
                      </InlineStack>
                      <Divider />

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={fields.map(f => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <BlockStack gap="300">
                            {fields.map((field, index) => (
                              <SortableField
                                key={field.id}
                                field={field}
                                index={index}
                                updateField={updateField}
                                removeField={removeField}
                                addOption={addOption}
                                updateOption={updateOption}
                                removeOption={removeOption}
                                fieldTypes={fieldTypes}
                                fieldWidths={fieldWidths}
                              />
                            ))}
                          </BlockStack>
                        </SortableContext>
                      </DndContext>
                      <Box paddingBlockStart="200">
                        <Button icon={PlusIcon} onClick={() => setIsAddFieldModalOpen(true)} fullWidth>Add Field</Button>
                      </Box>
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
                <Box padding="500" background="bg-surface-tertiary" borderRadius="300" borderWidth="025" borderColor="border">
                  <Text variant="headingLg" as="h3" alignment="center">{title || "Form Preview"}</Text>
                  <Box paddingBlockStart="500">
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '16px'
                    }}>
                      {fields.map((field) => {
                        const gridSpan = field.width === '33' ? 'span 2' : field.width === '50' ? 'span 3' : 'span 6';
                        return (
                          <div key={field.id} style={{ gridColumn: gridSpan }}>
                            <BlockStack gap="100">
                              <Text variant="bodyMd" fontWeight="bold">{field.label} {field.required && <span style={{ color: 'red' }}>*</span>}</Text>

                              {/* Rich Field Rendering */}
                              {field.type === "textarea" ? (
                                <div style={{ border: '1px solid #c9cccf', borderRadius: '4px', padding: '10px', minHeight: '80px', background: 'white', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                                  <Text variant="bodySm" tone="subdued">{field.placeholder}</Text>
                                </div>
                              ) : field.type === "select" ? (
                                <div style={{ border: '1px solid #c9cccf', borderRadius: '4px', padding: '10px', background: 'white', display: 'flex', justifyContent: 'space-between', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                                  <Text variant="bodySm" tone={field.defaultValue ? undefined : "subdued"}>
                                    {field.defaultValue || field.placeholder || "Select option..."}
                                  </Text>
                                  <Text variant="bodySm">▼</Text>
                                </div>
                              ) : field.type === "radio" || field.type === "checkbox" ? (
                                <BlockStack gap="100">
                                  {field.options?.map((opt, i) => {
                                    const isDefault = field.defaultValue === opt;
                                    const isChecked = field.type === "radio" ? isDefault : false;
                                    return (
                                      <InlineStack key={i} gap="200" blockAlign="center">
                                        <div style={{
                                          width: '16px',
                                          height: '16px',
                                          border: `2px solid ${isChecked ? submitColor : '#8c9196'}`,
                                          borderRadius: field.type === 'radio' ? '50%' : '3px',
                                          background: isChecked ? submitColor : 'white',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          flexShrink: 0,
                                        }}>
                                          {isChecked && (
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                                          )}
                                        </div>
                                        <Text variant="bodyMd" fontWeight={isDefault ? 'bold' : undefined}>{opt}</Text>
                                      </InlineStack>
                                    );
                                  })}
                                </BlockStack>
                              ) : field.type === "phone" ? (
                                <InlineStack gap="0">
                                  <div style={{ border: '1px solid #c9cccf', borderRight: 'none', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', padding: '10px', background: '#f4f6f8', display: 'flex', alignItems: 'center', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                                    <Text variant="bodySm">🇺🇸 +1</Text>
                                  </div>
                                  <div style={{ flex: 1, border: '1px solid #c9cccf', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', padding: '10px', background: 'white', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                                    <Text variant="bodySm" tone="subdued">Phone number</Text>
                                  </div>
                                </InlineStack>
                              ) : field.type === "file" ? (
                                <div style={{ border: '2px dashed #babfc3', borderRadius: '8px', padding: '24px', background: '#f4f6f8', textAlign: 'center', cursor: 'pointer' }}>
                                  <Text variant="bodyMd" fontWeight="bold">Add file</Text>
                                  <Text variant="bodySm" tone="subdued">or drop files to upload</Text>
                                </div>
                              ) : (
                                <div style={{ border: '1px solid #c9cccf', borderRadius: '4px', padding: '10px', background: 'white', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)' }}>
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
                      marginTop: '32px',
                      display: 'flex',
                      justifyContent: submitWidth === 'auto' ? 'center' : 'stretch'
                    }}>
                      <button style={{
                        width: submitWidth === 'auto' ? 'auto' : '100%',
                        backgroundColor: submitColor,
                        color: 'white',
                        padding: '14px 28px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'default',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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

      <Modal
        open={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        title="Select Field Type"
      >
        <Modal.Section>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            {fieldTypes.map((ft) => (
              <div 
                key={ft.value} 
                onClick={() => addField(ft.value, ft.label)}
                style={{
                  border: '1px solid #c9cccf',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#008060';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#c9cccf';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ color: '#008060', marginBottom: '12px' }}>
                  {ft.icon}
                </div>
                <Text variant="bodyMd" fontWeight="bold">{ft.label}</Text>
                <div style={{ marginTop: '4px' }}>
                  <Text variant="bodySm" tone="subdued">{ft.description}</Text>
                </div>
              </div>
            ))}
          </div>
        </Modal.Section>
      </Modal>

    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
