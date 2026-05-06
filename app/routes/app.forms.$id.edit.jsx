import { useState, useCallback, useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useFetcher, useNavigate, useLoaderData } from "react-router";
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
  Tabs,
  Checkbox,
  Tooltip,
  Modal,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon, DragHandleIcon, InfoIcon, MagicIcon } from "@shopify/polaris-icons";
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

export const loader = async ({ params, request }) => {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  const form = await prisma.form.findFirst({
    where: { id: String(id), shop: session.shop },
  });

  if (!form) {
    throw new Response("Not Found", { status: 404 });
  }

  return { form };
};

export const action = async ({ params, request }) => {
  const { session, redirect } = await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();

  const title = formData.get("title");
  const schema = JSON.parse(formData.get("schema"));
  const settings = JSON.parse(formData.get("settings"));

  await prisma.form.update({
    where: { id: String(id) },
    data: {
      title,
      schema,
      settings,
    },
  });

  return redirect(`/app/forms`);
};

function SortableField({ field, index, updateField, removeField, addOption, updateOption, removeOption, fieldTypes, fieldWidths, allFields }) {
  const triggerableFields = allFields.filter(f => f.id !== field.id && ["select", "radio", "checkbox"].includes(f.type) && f.options?.length > 0);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : 1, opacity: isDragging ? 0.9 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <Box padding="400" background={isDragging ? "bg-surface-active" : "bg-surface-secondary"} borderRadius="200" borderWidth="025" borderColor="border" shadow={isDragging ? "300" : "100"}>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="center">
              <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                <Icon source={DragHandleIcon} tone="subdued" />
              </div>
              <Text variant="headingSm" as="h3">Field #{index + 1}</Text>
            </InlineStack>
            {field.deletable && <Button icon={DeleteIcon} tone="critical" variant="plain" onClick={() => removeField(field.id)} />}
          </InlineStack>
          <InlineStack gap="300">
            <div style={{ flex: 2 }}><TextField label="Field Label" value={field.label} onChange={(val) => updateField(field.id, "label", val)} autoComplete="off" /></div>
            <div style={{ flex: 1 }}><Select label="Type" options={fieldTypes} value={field.type} onChange={(val) => updateField(field.id, "type", val)} disabled={!field.deletable} /></div>
            <div style={{ flex: 1 }}><Select label="Width" options={fieldWidths} value={field.width || "100"} onChange={(val) => updateField(field.id, "width", val)} /></div>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '24px', gap: '16px' }}>
              <Checkbox label="Required" checked={field.required} onChange={(val) => updateField(field.id, "required", val)} disabled={!field.deletable && field.required} />
              <Checkbox label="Show Label" checked={field.showLabel !== false} onChange={(val) => updateField(field.id, "showLabel", val)} />
            </div>
          </InlineStack>
        </BlockStack>
      </Box>
    </div>
  );
}

export default function EditForm() {
  const { form } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState(0);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);

  const [title, setTitle] = useState(form.title);
  const [fields, setFields] = useState(typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema);

  const initialSettings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
  const [submitText, setSubmitText] = useState(initialSettings.submitText || "Submit");
  const [submitColor, setSubmitColor] = useState(initialSettings.submitColor || "#008060");
  const [submitWidth, setSubmitWidth] = useState(initialSettings.submitWidth || "100");
  const [notificationEmails, setNotificationEmails] = useState(initialSettings.notificationEmails || "");
  const [layoutStyle, setLayoutStyle] = useState(initialSettings.layoutStyle || "clean-silhouette");
  const [alignment, setAlignment] = useState(initialSettings.alignment || "center");

  const [previewState, setPreviewState] = useState({});
  const handlePreviewChange = (fieldId, val) => setPreviewState(prev => ({ ...prev, [fieldId]: val }));

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const tabs = [
    { id: "fields", content: "Form Fields" },
    { id: "submit", content: "Submit Button" },
    { id: "customization", content: "Layout & Customization" },
    { id: "notifications", content: "Notifications" },
  ];

  const fieldTypeOptions = [
    { label: "Text", value: "text" }, { label: "Email", value: "email" }, { label: "Textarea", value: "textarea" },
    { label: "Checkbox", value: "checkbox" }, { label: "Radio", value: "radio" }, { label: "Dropdown", value: "select" },
    { label: "File Upload", value: "file" }, { label: "Phone", value: "phone" },
  ];

  const fieldWidths = [{ label: "100%", value: "100" }, { label: "50%", value: "50" }, { label: "33%", value: "33" }];

  const addField = (type = "text", label = "New Field") => {
    const newField = { id: `field_${Date.now()}`, type, label, required: false, showLabel: true, deletable: true, options: ["radio", "select", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : [], width: "100" };
    setFields([...fields, newField]);
    setIsAddFieldModalOpen(false);
  };

  const removeField = (id) => setFields(fields.filter((f) => f.id !== id));
  const updateField = (id, key, value) => setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));

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

  const handleSave = () => {
    fetcher.submit({
      title,
      schema: JSON.stringify(fields),
      settings: JSON.stringify({ submitText, submitColor, submitWidth, notificationEmails, layoutStyle, alignment }),
    }, { method: "POST" });
  };

  return (
    <Page
      fullWidth
      title={`Edit Form: ${form.title}`}
      backAction={{ content: "Forms", url: "/app/forms" }}
      primaryAction={{ content: "Save Changes", onAction: handleSave, loading: fetcher.state === "submitting" }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card><TextField label="Form Name" value={title} onChange={setTitle} autoComplete="off" /></Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box paddingBlockStart="400">
                {selectedTab === 0 ? (
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingMd">Form Fields</Text>
                        <Button icon={PlusIcon} onClick={() => setIsAddFieldModalOpen(true)} variant="primary">Add Field</Button>
                      </InlineStack>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                          <BlockStack gap="300">
                            {fields.map((field, index) => (
                              <SortableField key={field.id} field={field} index={index} updateField={updateField} removeField={removeField} fieldTypes={fieldTypeOptions} fieldWidths={fieldWidths} allFields={fields} />
                            ))}
                          </BlockStack>
                        </SortableContext>
                      </DndContext>
                    </BlockStack>
                  </Card>
                ) : selectedTab === 1 ? (
                  <Card>
                    <BlockStack gap="400">
                      <TextField label="Button Text" value={submitText} onChange={setSubmitText} autoComplete="off" />
                      <Select label="Button Width" options={[{ label: "Full Width", value: "100" }, { label: "Auto", value: "auto" }]} value={submitWidth} onChange={setSubmitWidth} />
                    </BlockStack>
                  </Card>
                ) : selectedTab === 2 ? (
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd">Layout & Customization</Text>
                      <BlockStack gap="200">
                        <Text variant="bodyMd" fontWeight="bold">Form Style</Text>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          {[
                            { id: 'clean-silhouette', label: 'Clean Silhouette', desc: 'Thin Border' },
                            { id: 'classic-canvas', label: 'Classic Canvas', desc: 'BG + Border' },
                            { id: 'modern-floating', label: 'Modern Floating', desc: 'Drop Shadow' },
                          ].map(style => (
                            <div key={style.id} onClick={() => setLayoutStyle(style.id)} style={{ cursor: 'pointer', padding: '16px', borderRadius: '8px', border: layoutStyle === style.id ? '2px solid #008060' : '1px solid #e1e3e5', background: layoutStyle === style.id ? '#f0fdf4' : 'white', textAlign: 'center', transition: 'all 0.2s' }}>
                              <Text variant="bodySm" fontWeight="bold">{style.label}</Text>
                              <Text variant="bodyXs" tone="subdued">{style.desc}</Text>
                            </div>
                          ))}
                        </div>
                      </BlockStack>
                      <Select label="Alignment" options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }]} value={alignment} onChange={setAlignment} />
                    </BlockStack>
                  </Card>
                ) : (
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h2">Email Notifications</Text>
                      <Text variant="bodyMd" tone="subdued">
                        Enter the email addresses that should receive a notification when this form is submitted. Separate multiple emails with a comma.
                      </Text>
                      <TextField
                        label="Receive Emails"
                        value={notificationEmails}
                        onChange={setNotificationEmails}
                        autoComplete="off"
                        placeholder="e.g. admin@store.com, sales@store.com"
                        helpText="If left empty, notifications will be sent to the store admin email by default."
                      />
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
                <Text variant="headingMd">Live Preview</Text>
                <div style={{
                  padding: '32px',
                  background: layoutStyle === 'classic-canvas' ? '#f9fafb' : '#fff',
                  borderRadius: '16px',
                  boxShadow: layoutStyle === 'modern-floating' ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
                  border: layoutStyle === 'modern-floating' ? 'none' : '1px solid #e1e3e5',
                  marginLeft: alignment === 'center' ? 'auto' : alignment === 'right' ? 'auto' : '0',
                  marginRight: alignment === 'center' ? 'auto' : alignment === 'left' ? 'auto' : '0',
                  fontFamily: '"Outfit", sans-serif',
                  transition: 'all 0.3s ease'
                }}>
                  <Text variant="headingSm" as="h3" alignment="center" fontWeight="bold" style={{ marginBottom: '24px' }}>{title || "Form Preview"}</Text>
                  
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
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
      <Modal open={isAddFieldModalOpen} onClose={() => setIsAddFieldModalOpen(false)} title="Add New Field">
        <Modal.Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['text', 'email', 'textarea', 'checkbox', 'radio', 'select'].map(t => (
              <Button key={t} onClick={() => addField(t, `New ${t} field`)}>{t.toUpperCase()}</Button>
            ))}
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
