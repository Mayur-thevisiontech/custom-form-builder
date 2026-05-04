import { useState } from "react";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  EmptyState,
  Badge,
  Modal,
  TextField,
  BlockStack,
  InlineStack,
  Box,
  Divider,
  Icon,
} from "@shopify/polaris";
import { EditIcon, DeleteIcon, ViewIcon, PlusIcon } from "@shopify/polaris-icons";
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

  if (request.method === "POST") {
    const intent = formData.get("intent");
    if (intent === "update_basic") {
      await prisma.form.update({
        where: { id: String(id) },
        data: {
          title: formData.get("title"),
          settings: JSON.parse(formData.get("settings")),
        },
      });
      return { success: true };
    }
  }

  if (request.method === "DELETE" && id) {
    await prisma.form.delete({ where: { id: String(id) } });
    return { success: true };
  }

  return { success: false };
};

export default function FormsIndex() {
  const { forms } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", submitText: "", submitColor: "" });

  const openModal = (type, form) => {
    setSelectedForm(form);
    setActiveModal(type);
    if (type === "edit") {
      const settings = form.settings ? JSON.parse(form.settings) : { submitText: "Submit", submitColor: "#008060" };
      setEditForm({ title: form.title, submitText: settings.submitText, submitColor: settings.submitColor });
    }
  };

  const closeModal = () => { setSelectedForm(null); setActiveModal(null); };

  const handleEditSave = () => {
    fetcher.submit(
      { id: selectedForm.id, title: editForm.title, settings: JSON.stringify({ submitText: editForm.submitText, submitColor: editForm.submitColor }), intent: "update_basic" },
      { method: "POST" }
    );
    closeModal();
  };

  const getFieldCount = (schema) => {
    try { return JSON.parse(schema)?.length || 0; } catch { return 0; }
  };

  return (
    <Page
      fullWidth
      title="My Forms"
      subtitle={`${forms.length} form${forms.length !== 1 ? "s" : ""} created`}
      primaryAction={{
        content: "Create New Form",
        icon: PlusIcon,
        onAction: () => navigate("/app/forms/new"),
      }}
    >
      {/* Stats Bar */}
      <Box paddingBlockEnd="500">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { label: "Total Forms", value: forms.length },
            { label: "Active Forms", value: forms.length },
            { label: "Total Fields", value: forms.reduce((acc, f) => acc + getFieldCount(f.schema), 0) },
          ].map((stat) => (
            <Card key={stat.label}>
              <BlockStack gap="100">
                <Text variant="bodySm" tone="subdued">{stat.label}</Text>
                <Text variant="headingXl" as="p" fontWeight="bold">{stat.value}</Text>
              </BlockStack>
            </Card>
          ))}
        </div>
      </Box>

      {forms.length === 0 ? (
        <Card>
          <EmptyState
            heading="Create your first form"
            action={{ content: "Create form", onAction: () => navigate("/app/forms/new") }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Start by creating your first custom form to collect data from your customers.</p>
          </EmptyState>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {forms.map(({ id, title, createdAt, schema, settings }) => {
            const submitColor = (() => { try { return JSON.parse(settings)?.submitColor || "#008060"; } catch { return "#008060"; } })();
            const fieldCount = getFieldCount(schema);
            const dateStr = new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

            return (
              <div key={id} style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e1e3e5",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
              }}>
                {/* Card color bar */}
                <div style={{ height: "4px", background: submitColor }} />

                <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h3" fontWeight="semibold">{title}</Text>
                      <Badge tone="success">Active</Badge>
                    </InlineStack>
                    <InlineStack gap="400">
                      <Text variant="bodySm" tone="subdued">📅 {dateStr}</Text>
                      <Text variant="bodySm" tone="subdued">📋 {fieldCount} field{fieldCount !== 1 ? "s" : ""}</Text>
                    </InlineStack>
                  </BlockStack>
                </div>

                <div style={{ padding: "4px 20px 20px" }}>
                  <Text variant="bodySm" tone="subdued" as="p" fontWeight="regular">
                    Form ID: <code style={{ fontSize: "11px", background: "#f4f6f8", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>{id}</code>
                  </Text>
                </div>

                <Divider />

                <div style={{ padding: "12px 16px", background: "#f9fafb" }}>
                  <InlineStack gap="200" align="end">
                    <Button size="slim" icon={ViewIcon} onClick={() => openModal("view", { id, title, schema, settings })}>
                      View
                    </Button>
                    <Button size="slim" icon={EditIcon} onClick={() => navigate(`/app/forms/${id}/edit`)}>
                      Edit
                    </Button>
                    <Button size="slim" icon={DeleteIcon} tone="critical" onClick={() => openModal("delete", { id, title })}>
                      Delete
                    </Button>
                  </InlineStack>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        open={activeModal === "delete"}
        onClose={closeModal}
        title="Delete Form?"
        primaryAction={{ content: "Delete", destructive: true, onAction: () => { fetcher.submit({ id: selectedForm.id }, { method: "DELETE" }); closeModal(); } }}
        secondaryActions={[{ content: "Cancel", onAction: closeModal }]}
      >
        <Modal.Section>
          <Text as="p">Are you sure you want to delete <strong>{selectedForm?.title}</strong>? This action cannot be undone.</Text>
        </Modal.Section>
      </Modal>

      {/* View/Preview Modal */}
      <Modal open={activeModal === "view"} onClose={closeModal} title={`Preview: ${selectedForm?.title}`} large>
        <Modal.Section>
          <div style={{ fontFamily: '"Outfit", sans-serif', padding: "8px" }}>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
            <BlockStack gap="400">
              {selectedForm?.schema && JSON.parse(selectedForm.schema).map((field) => (
                <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                    {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#9ca3af", fontSize: "15px" }}>
                    {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  </div>
                  {field.helpText && <div style={{ fontSize: "12px", color: "#6b7280" }}>{field.helpText}</div>}
                </div>
              ))}
              <div style={{ marginTop: "8px" }}>
                {(() => {
                  const s = selectedForm?.settings ? JSON.parse(selectedForm.settings) : {};
                  return (
                    <button style={{ backgroundColor: s.submitColor || "#008060", color: "white", padding: "14px 28px", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "default", boxShadow: `0 4px 14px ${s.submitColor || "#008060"}40` }}>
                      {s.submitText || "Submit"}
                    </button>
                  );
                })()}
              </div>
            </BlockStack>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
