import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Button,
  EmptyState,
  Badge,
  Modal,
  TextField,
  BlockStack,
  InlineStack,
  Box,
  ButtonGroup,
} from "@shopify/polaris";
import { ViewIcon, EditIcon, DeleteIcon } from "@shopify/polaris-icons";
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
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null); // 'view', 'delete'
  const [selectedForm, setSelectedForm] = useState(null);

  const [editForm, setEditForm] = useState({ title: "", submitText: "", submitColor: "" });

  const openModal = (type, form) => {
    setSelectedForm(form);
    setActiveModal(type);
    if (type === "edit") {
      const settings = form.settings ? JSON.parse(form.settings) : { submitText: "Submit", submitColor: "#008060" };
      setEditForm({
        title: form.title,
        submitText: settings.submitText,
        submitColor: settings.submitColor
      });
    }
  };

  const handleEditSave = () => {
    fetcher.submit(
      { id: selectedForm.id, title: editForm.title, settings: JSON.stringify({ submitText: editForm.submitText, submitColor: editForm.submitColor }), intent: 'update_basic' },
      { method: "POST" }
    );
    closeModal();
  };

  const closeModal = () => {
    setSelectedForm(null);
    setActiveModal(null);
  };

  const resourceName = {
    singular: "form",
    plural: "forms",
  };

  const rowMarkup = forms.map(
    ({ id, title, createdAt, schema, settings }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="info">Active</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end">
            <ButtonGroup>
              <Button
                icon={ViewIcon}
                onClick={() => openModal("view", { id, title, schema, settings })}
                accessibilityLabel="View form"
              >
                View
              </Button>
              <Button
                icon={EditIcon}
                onClick={() => openModal("edit", { id, title, schema, settings })}
                accessibilityLabel="Edit form"
              >
                Edit
              </Button>
              <Button
                icon={DeleteIcon}
                tone="critical"
                onClick={() => openModal("delete", { id, title })}
                accessibilityLabel="Delete form"
              >
                Delete
              </Button>
            </ButtonGroup>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page
      fullWidth
      title="My Forms"
      subtitle="Manage and track your custom storefront forms"
      primaryAction={{
        content: "Create New Form",
        onAction: () => navigate("/app/forms/new"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {forms.length === 0 ? (
              <EmptyState
                heading="No forms found"
                action={{
                  content: "Create form",
                  onAction: () => navigate("/app/forms/new"),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Start by creating your first custom form to collect data from your customers.</p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={forms.length}
                headings={[
                  { title: "Form Name" },
                  { title: "Created At" },
                  { title: "Status" },
                  { title: "Actions", alignment: "end" },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {/* Delete Confirmation Modal */}
      <Modal
        open={activeModal === "delete"}
        onClose={closeModal}
        title="Delete Form?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: () => {
            fetcher.submit({ id: selectedForm.id }, { method: "DELETE" });
            closeModal();
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeModal,
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete <strong>{selectedForm?.title}</strong>? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>

      {/* View/Preview Modal */}
      <Modal
        open={activeModal === "view"}
        onClose={closeModal}
        title={`Preview: ${selectedForm?.title}`}
        large
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="400">
                {selectedForm?.schema && JSON.parse(selectedForm.schema).map((field) => (
                  <div key={field.id}>
                    <Text variant="bodyMd" fontWeight="bold">{field.label} {field.required && "*"}</Text>
                    <Box paddingBlockStart="100">
                      <div style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: 'white',
                        color: '#666'
                      }}>
                        {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      </div>
                      {field.helpText && (
                        <Text variant="bodySm" tone="subdued">{field.helpText}</Text>
                      )}
                    </Box>
                  </div>
                ))}
                <div style={{ marginTop: '10px' }}>
                  <button
                    style={{
                      backgroundColor: selectedForm?.settings ? JSON.parse(selectedForm.settings).submitColor : '#008060',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'default'
                    }}
                  >
                    {selectedForm?.settings ? JSON.parse(selectedForm.settings).submitText : 'Submit'}
                  </button>
                </div>
              </BlockStack>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Edit Basic Info Modal */}
      <Modal
        open={activeModal === "edit"}
        onClose={closeModal}
        title="Edit Form Settings"
        primaryAction={{
          content: "Save Changes",
          onAction: handleEditSave,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[{ content: "Cancel", onAction: closeModal }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Form Title"
              value={editForm.title}
              onChange={(val) => setEditForm({ ...editForm, title: val })}
              autoComplete="off"
            />
            <TextField
              label="Submit Button Text"
              value={editForm.submitText}
              onChange={(val) => setEditForm({ ...editForm, submitText: val })}
              autoComplete="off"
            />
            <TextField
              label="Submit Button Color (Hex)"
              value={editForm.submitColor}
              onChange={(val) => setEditForm({ ...editForm, submitColor: val })}
              autoComplete="off"
            />
            <Button
              variant="plain"
              onClick={() => {
                closeModal();
                navigate(`/app/forms/new?id=${selectedForm.id}`);
              }}
            >
              Open Full Builder (Add/Remove Fields)
            </Button>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
