import { useState, useCallback } from "react";
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
import { DeleteIcon, PlusIcon, DragHandleIcon, InfoIcon } from "@shopify/polaris-icons";
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
  const { session, redirect } = await authenticate.admin(request);
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
  { id: "first_name", type: "text", label: "First Name", required: true, showLabel: true, deletable: false, width: "50" },
  { id: "email", type: "email", label: "Email", required: true, showLabel: true, deletable: false, width: "100" },
];

function SortableField({ field, index, updateField, removeField, addOption, updateOption, removeOption, fieldTypes, fieldWidths, allFields }) {
  const triggerableFields = allFields.filter(f => f.id !== field.id && ["select", "radio", "checkbox"].includes(f.type) && f.options?.length > 0);

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
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '24px', gap: '16px' }}>
              <Checkbox
                label="Required"
                checked={field.required}
                onChange={(val) => updateField(field.id, "required", val)}
                disabled={!field.deletable && field.required}
              />
              <Checkbox
                label="Show Label"
                checked={field.showLabel !== false}
                onChange={(val) => updateField(field.id, "showLabel", val)}
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
                  <Text variant="headingXs" fontWeight="bold">Options value</Text>
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
          {/* Conditional Logic Configuration */}
          <Box paddingBlockStart="200" paddingBlockEnd="100">
            <Card background="bg-surface-secondary">
              <BlockStack gap="300">
                <Checkbox
                  label="Enable Conditional Logic (Hide/Show field based on another field)"
                  checked={!!field.logic}
                  onChange={(checked) => {
                    if (checked) {
                      updateField(field.id, "logic", { action: "show", triggerFieldId: "", triggerValue: "" });
                    } else {
                      updateField(field.id, "logic", null);
                    }
                  }}
                />

                {field.logic && (
                  <InlineStack gap="300" align="start">
                    <div style={{ flex: 1 }}>
                      <Select
                        label="Action"
                        options={[{ label: "Show this field", value: "show" }, { label: "Hide this field", value: "hide" }]}
                        value={field.logic.action || "show"}
                        onChange={(val) => updateField(field.id, "logic", { ...field.logic, action: val })}
                      />
                    </div>
                    <div style={{ flex: 1, alignSelf: 'center', paddingTop: '24px' }}>
                      <Text variant="bodyMd" alignment="center">when</Text>
                    </div>
                    <div style={{ flex: 2 }}>
                      <Select
                        label="Target Field"
                        options={[
                          { label: "Select field...", value: "" },
                          ...triggerableFields.map(f => ({ label: f.label, value: f.id }))
                        ]}
                        value={field.logic.triggerFieldId || ""}
                        onChange={(val) => updateField(field.id, "logic", { ...field.logic, triggerFieldId: val, triggerValue: "" })}
                      />
                    </div>
                    <div style={{ flex: 1, alignSelf: 'center', paddingTop: '24px' }}>
                      <Text variant="bodyMd" alignment="center">equals</Text>
                    </div>
                    <div style={{ flex: 2 }}>
                      {field.logic.triggerFieldId ? (
                        <Select
                          label="Target Value"
                          options={[
                            { label: "Select value...", value: "" },
                            ...(allFields.find(f => f.id === field.logic.triggerFieldId)?.options || []).map(opt => ({ label: opt, value: opt }))
                          ]}
                          value={field.logic.triggerValue || ""}
                          onChange={(val) => updateField(field.id, "logic", { ...field.logic, triggerValue: val })}
                        />
                      ) : (
                        <Select label="Target Value" options={[{ label: "Select field first", value: "" }]} disabled />
                      )}
                    </div>
                  </InlineStack>
                )}
              </BlockStack>
            </Card>
          </Box>
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

  const [previewState, setPreviewState] = useState({});
  const handlePreviewChange = (fieldId, val) => {
    setPreviewState(prev => ({ ...prev, [fieldId]: val }));
  };

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

  const fieldTypeOptions = [
    { label: "Text", value: "text" },
    { label: "Email", value: "email" },
    { label: "Textarea", value: "textarea" },
    { label: "Checkbox", value: "checkbox" },
    { label: "Radio", value: "radio" },
    { label: "Dropdown", value: "select" },
    { label: "File Upload", value: "file" },
    { label: "Phone", value: "phone" },
  ];

  const availableFieldTypes = [
    {
      label: "Text Box",
      value: "text",
      description: "Generic single-line text input",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="16" width="40" height="16" rx="4" stroke="currentColor" strokeWidth="2" /><line x1="8" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    },

    {
      label: "Email",
      value: "email",
      description: "Validates email address format",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="12" width="40" height="24" rx="4" stroke="currentColor" strokeWidth="2" /><path d="M4 16L24 28L44 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
    },
    {
      label: "Phone No",
      value: "phone",
      description: "With country code selection",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="4" width="24" height="40" rx="4" stroke="currentColor" strokeWidth="2" /><circle cx="24" cy="38" r="2" fill="currentColor" /></svg>
    },
    {
      label: "Textarea",
      value: "textarea",
      description: "Multi-line text input",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" /><line x1="10" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="10" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="10" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    },
    {
      label: "Checkbox",
      value: "checkbox",
      description: "Multiple choice (can select many)",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="14" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2" /><path d="M20 24L23 27L29 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    },
    {
      label: "Radio",
      value: "radio",
      description: "Multiple choice (select one)",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="24" cy="24" r="4" fill="currentColor" /></svg>
    },
    {
      label: "Dropdown",
      value: "select",
      description: "Select from a dropdown list",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="16" width="36" height="16" rx="4" stroke="currentColor" strokeWidth="2" /><path d="M34 22L38 26L42 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    },
    {
      label: "File Upload",
      value: "file",
      description: "Upload an attachment",
      icon: <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="12" width="36" height="24" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" /><path d="M24 18V30M20 22L24 18L28 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    }
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
      showLabel: true,
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

            <div style={{
              display: 'flex',
              background: '#ebeef0',
              padding: '6px',
              borderRadius: '12px',
              width: '100%',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
            }}>
              {tabs.map((tab, index) => {
                const isActive = selectedTab === index;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(index)}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#008060' : '#5c5f62',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.color = '#202223';
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.color = '#5c5f62';
                    }}
                  >
                    {tab.content}
                  </button>
                );
              })}
            </div>

            <Box paddingBlockStart="200">
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
                              fieldTypes={fieldTypeOptions}
                              fieldWidths={fieldWidths}
                              allFields={fields}
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
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <div style={{ position: 'sticky', top: '20px' }}>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Live Preview</Text>
                <Divider />
                <div style={{
                  padding: '32px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                  border: '1px solid #e1e3e5',
                  fontFamily: '"Outfit", sans-serif'
                }}>
                  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
                  <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', textAlign: 'center', margin: '0 0 32px 0' }}>
                    {title || "Form Preview"}
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '24px 16px'
                  }}>
                    {fields.map((field) => {
                      // Conditional Logic Check
                      if (field.logic && field.logic.triggerFieldId && field.logic.triggerValue) {
                        const triggerField = fields.find(f => f.id === field.logic.triggerFieldId);
                        const currentVal = previewState[field.logic.triggerFieldId] !== undefined ? previewState[field.logic.triggerFieldId] : triggerField?.defaultValue || "";

                        const valsArray = Array.isArray(currentVal) ? currentVal : [currentVal];
                        const conditionMet = valsArray.includes(field.logic.triggerValue);

                        if (field.logic.action === "show" && !conditionMet) return null;
                        if (field.logic.action === "hide" && conditionMet) return null;
                      }

                      const gridSpan = field.width === '33' ? 'span 2' : field.width === '50' ? 'span 3' : 'span 6';

                      const inputStyle = {
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        fontSize: '15px',
                        color: '#374151',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      };

                      return (
                        <div key={field.id} style={{ gridColumn: gridSpan }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {field.showLabel !== false && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>
                                  {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                {field.helpText && (
                                  <Tooltip content={field.helpText}>
                                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                      <Icon source={InfoIcon} tone="subdued" />
                                    </div>
                                  </Tooltip>
                                )}
                              </div>
                            )}

                            {/* Rich Field Rendering */}
                            {field.type === "textarea" ? (
                              <div style={{ ...inputStyle, minHeight: '100px' }}>
                                <span style={{ color: '#9ca3af' }}>{field.placeholder || `Enter ${field.label.toLowerCase()}...`}</span>
                              </div>
                            ) : field.type === "select" ? (
                              <div style={{ position: 'relative' }}>
                                <select
                                  value={previewState[field.id] !== undefined ? previewState[field.id] : field.defaultValue || ""}
                                  onChange={(e) => handlePreviewChange(field.id, e.target.value)}
                                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', color: (previewState[field.id] !== undefined ? previewState[field.id] : field.defaultValue) ? '#374151' : '#9ca3af' }}
                                >
                                  <option value="">{field.placeholder || "Select option..."}</option>
                                  {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                </select>
                                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
                                  ▼
                                </div>
                              </div>
                            ) : field.type === "radio" || field.type === "checkbox" ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                                {field.options?.map((opt, i) => {
                                  const currentVal = previewState[field.id] !== undefined ? previewState[field.id] : field.defaultValue || (field.type === 'checkbox' ? [] : "");
                                  const isChecked = field.type === "radio" ? currentVal === opt : (Array.isArray(currentVal) && currentVal.includes(opt));

                                  return (
                                    <div key={i} onClick={() => {
                                      if (field.type === "radio") {
                                        handlePreviewChange(field.id, opt);
                                      } else {
                                        const arr = Array.isArray(currentVal) ? currentVal : [];
                                        handlePreviewChange(field.id, arr.includes(opt) ? arr.filter(v => v !== opt) : [...arr, opt]);
                                      }
                                    }} style={{
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      padding: '12px 16px',
                                      borderRadius: '8px',
                                      border: `1px solid ${isChecked ? submitColor : '#e5e7eb'}`,
                                      backgroundColor: isChecked ? `${submitColor}08` : '#ffffff',
                                      transition: 'all 0.2s'
                                    }}>
                                      <div style={{
                                        width: '18px',
                                        height: '18px',
                                        border: `2px solid ${isChecked ? submitColor : '#d1d5db'}`,
                                        borderRadius: field.type === 'radio' ? '50%' : '4px',
                                        backgroundColor: isChecked ? submitColor : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                      }}>
                                        {isChecked && (
                                          <div style={{ width: '8px', height: '8px', borderRadius: field.type === 'radio' ? '50%' : '2px', backgroundColor: 'white' }} />
                                        )}
                                      </div>
                                      <span style={{ fontSize: '15px', color: isChecked ? '#111827' : '#4b5563', fontWeight: isChecked ? '500' : '400' }}>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : field.type === "phone" ? (
                              <div style={{ display: 'flex' }}>
                                <div style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderRight: 'none', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center' }}>
                                  <span style={{ fontSize: '15px', color: '#4b5563' }}>🇺🇸 +1</span>
                                </div>
                                <div style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, flex: 1 }}>
                                  <span style={{ color: '#9ca3af' }}>Phone number</span>
                                </div>
                              </div>
                            ) : field.type === "file" ? (
                              <div style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px 24px', backgroundColor: '#f9fafb', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Add file</div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>or drop files to upload</div>
                              </div>
                            ) : (
                              <div style={inputStyle}>
                                <span style={{ color: '#9ca3af' }}>{field.placeholder || `Enter ${field.label.toLowerCase()}...`}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    marginTop: '40px',
                    display: 'flex',
                    justifyContent: submitWidth === 'auto' ? 'center' : 'stretch'
                  }}>
                    <button style={{
                      width: submitWidth === 'auto' ? 'auto' : '100%',
                      backgroundColor: submitColor,
                      color: '#ffffff',
                      padding: '16px 32px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'default',
                      boxShadow: `0 4px 14px ${submitColor}40`,
                      transition: 'all 0.2s',
                      fontFamily: '"Outfit", sans-serif'
                    }}>
                      {submitText}
                    </button>
                  </div>
                </div>
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
        title="Select Your Field"
      >
        <Modal.Section>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            {availableFieldTypes.map((ft) => {
              const isAlreadyAdded = ["First Name", "Email"].includes(ft.label) && fields.some(f => f.label === ft.label);

              return (
                <div
                  key={ft.label}
                  onClick={() => !isAlreadyAdded && addField(ft.value, ft.label)}
                  style={{
                    border: '1px solid #c9cccf',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                    backgroundColor: isAlreadyAdded ? '#f4f6f8' : 'white',
                    opacity: isAlreadyAdded ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isAlreadyAdded) {
                      e.currentTarget.style.borderColor = '#008060';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isAlreadyAdded) {
                      e.currentTarget.style.borderColor = '#c9cccf';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ color: isAlreadyAdded ? '#8c9196' : '#008060', marginBottom: '12px' }}>
                    {ft.icon}
                  </div>
                  <Text variant="bodyMd" fontWeight="bold">{ft.label}</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text variant="bodySm" tone="subdued">
                      {isAlreadyAdded ? "Already added" : ft.description}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal.Section>
      </Modal>

    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
