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
import { EditIcon, DeleteIcon, ViewIcon, PlusIcon, DuplicateIcon, CheckIcon, XIcon, OrderIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const forms = await prisma.$queryRaw`
    SELECT * FROM Form 
    WHERE shop = ${session.shop} 
    ORDER BY createdAt DESC
  `;

  // console.log("Forms from DB (raw):", JSON.stringify(forms, null, 2));

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
    if (intent === "toggle_status") {
      const forms = await prisma.$queryRaw`SELECT active FROM Form WHERE id = ${String(id)}`;
      if (forms && forms.length > 0) {
        const currentActive = forms[0].active;
        const newActive = (currentActive === 1 || currentActive === true) ? 0 : 1;
        await prisma.$executeRaw`UPDATE Form SET active = ${newActive} WHERE id = ${String(id)}`;
      }
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
  const safeParse = (data, fallback = []) => {
    if (typeof data === "string") {
      try { return JSON.parse(data); } catch (e) { return fallback; }
    }
    return data || fallback;
  };

  const getFieldCount = (schema) => {
    const s = safeParse(schema);
    return Array.isArray(s) ? s.length : 0;
  };

  return (
    <Page
      fullWidth
      title="Forms"
      // subtitle={`${forms.length} form${forms.length !== 1 ? "s" : ""} created`}
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
            { label: "Active Forms", value: forms.filter(f => f.active === true || f.active === 1 || f.active === "true").length },
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
          {forms.map(({ id, title, createdAt, schema, settings, active }) => {
            const isFormActive = active === true || active === 1 || active === "true";
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
                      <Badge tone={isFormActive ? "success" : "attention"}>
                        {isFormActive ? "Active" : "Inactive"}
                      </Badge>
                    </InlineStack>
                    <InlineStack gap="400" blockAlign="center">
                      <Text variant="bodySm" tone="subdued">📅 {dateStr}</Text>
                      <InlineStack gap="200" blockAlign="center">
                        <Button 
                          size="micro" 
                          tone={isFormActive ? "critical" : "success"}
                          onClick={(e) => {
                            e.stopPropagation();
                            fetcher.submit({ id, intent: "toggle_status" }, { method: "POST" });
                          }}
                        >
                          {isFormActive ? "Deactivate" : "Activate"}
                        </Button>
                      </InlineStack>
                    </InlineStack>
                  </BlockStack>
                </div>

                <div style={{ padding: "0 20px 20px" }}>
                  <Box background="bg-surface-secondary" padding="200" borderRadius="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text variant="bodyXs" tone="subdued">FORM ID</Text>
                        <code style={{ fontSize: "11px", color: "#4b5563", fontFamily: "monospace" }}>{id}</code>
                      </BlockStack>
                      <Button
                        variant="tertiary"
                        icon={DuplicateIcon}
                        onClick={() => {
                          navigator.clipboard.writeText(id);
                          if (window.shopify) {
                            window.shopify.toast.show("ID Copied to clipboard");
                          } else {
                            alert("ID Copied: " + id);
                          }
                        }}
                        size="micro"
                        accessibilityLabel="Copy ID"
                      />
                    </InlineStack>
                  </Box>
                </div>

                <Divider />

                <div style={{ padding: "12px 16px", background: "#f9fafb" }}>
                  <InlineStack gap="200" align="end">
                    <Button size="slim" icon={OrderIcon} onClick={() => navigate(`/app/forms/${id}/submissions`)}>
                      Submissions
                    </Button>
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
          <div style={{ padding: "8px" }}>
            <BlockStack gap="400">
              {selectedForm?.schema && safeParse(selectedForm.schema).map((field) => (
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
                  const s = selectedForm?.settings ? safeParse(selectedForm.settings, {}) : {};
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
