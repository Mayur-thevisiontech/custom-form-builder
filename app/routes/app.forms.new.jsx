import { useState, useCallback } from "react";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const forms = await prisma.form.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // Count submissions for each form
  const formsWithCounts = await Promise.all(
    forms.map(async (form) => {
      const submissionCount = await prisma.submission.count({
        where: { formId: form.id },
      });
      return { ...form, submissionCount };
    })
  );

  return { forms: formsWithCounts };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id");
  const intent = formData.get("intent");

  if (intent === "delete" && id) {
    await prisma.submission.deleteMany({ where: { formId: String(id) } });
    await prisma.form.delete({ where: { id: String(id) } });
    return { success: true };
  }

  if (intent === "duplicate" && id) {
    const original = await prisma.form.findUnique({ where: { id: String(id) } });
    if (original) {
      await prisma.form.create({
        data: {
          shop: session.shop,
          title: `${original.title} (Copy)`,
          handle: `${original.handle}-copy-${Date.now()}`,
          schema: original.schema,
          settings: original.settings,
        },
      });
    }
    return { success: true };
  }

  return { success: false };
};

const formatDate = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${yyyy}-${mm}-${dd} ${hours}:${minutes} ${ampm}`;
};

// Icon components
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8.5" cy="8.5" r="5.5" stroke="#6B7280" strokeWidth="1.5" />
    <path d="M14 14L17 17" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M3 5h14M6 10h8M9 15h2" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M10 3v14M10 3L7 6M10 3l3 3M14 17l-4-4-4 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <rect x="7" y="7" width="10" height="10" rx="2" stroke="#6B7280" strokeWidth="1.5" />
    <path d="M13 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke="#6B7280" strokeWidth="1.5" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" stroke="#6B7280" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const MoreIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="5" r="1.2" fill="#6B7280" />
    <circle cx="10" cy="10" r="1.2" fill="#6B7280" />
    <circle cx="10" cy="15" r="1.2" fill="#6B7280" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="#9CA3AF" strokeWidth="1.5" />
    <path d="M10 9v5M10 7v.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path d="M13 15l-5-5 5-5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path d="M7 5l5 5-5 5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function FormsIndex() {
  const { forms } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState("all");
  const [checkedIds, setCheckedIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const allForms = forms;
  const activeForms = forms.filter(() => true); // all active for now
  const inactiveForms = [];

  const tabForms =
    selectedTab === "active" ? activeForms :
      selectedTab === "inactive" ? inactiveForms :
        allForms;

  const filteredForms = searchQuery
    ? tabForms.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : tabForms;

  const toggleCheck = (id) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (checkedIds.length === filteredForms.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(filteredForms.map(f => f.id));
    }
  };

  const handleDuplicate = (id) => {
    fetcher.submit({ id, intent: "duplicate" }, { method: "POST" });
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = (id) => {
    fetcher.submit({ id, intent: "delete" }, { method: "POST" });
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  };

  const tabs = [
    { id: "all", label: "All", count: allForms.length },
    { id: "active", label: "Active", count: activeForms.length },
    { id: "inactive", label: "Inactive", count: inactiveForms.length },
  ];

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: "#F3F4F6",
      minHeight: "100vh",
      padding: "0",
    }}>
      {/* Breadcrumb */}
      <div style={{
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        color: "#6B7280",
      }}>
        <span style={{ cursor: "pointer", color: "#6B7280" }} onClick={() => navigate("/app")}>Dashboard</span>
        <span style={{ color: "#9CA3AF" }}>›</span>
        <span style={{ color: "#111827", fontWeight: "500" }}>Forms</span>
      </div>

      {/* Main Card */}
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: "10px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 0",
          }}>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "600", color: "#111827" }}>Forms</h2>
            <button
              onClick={() => navigate("/app/forms/new")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#111827",
                color: "white",
                border: "none",
                borderRadius: "7px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#1F2937"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#111827"}
            >
              <PlusIcon />
              New form
            </button>
          </div>

          {/* Tabs + Actions row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid #F3F4F6",
            marginTop: "4px",
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "0" }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  style={{
                    padding: "12px 4px",
                    marginRight: "20px",
                    background: "none",
                    border: "none",
                    borderBottom: selectedTab === tab.id ? "2px solid #111827" : "2px solid transparent",
                    color: selectedTab === tab.id ? "#111827" : "#6B7280",
                    fontSize: "13px",
                    fontWeight: selectedTab === tab.id ? "600" : "400",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                  <span style={{
                    background: selectedTab === tab.id ? "#111827" : "#F3F4F6",
                    color: selectedTab === tab.id ? "white" : "#6B7280",
                    borderRadius: "20px",
                    padding: "1px 7px",
                    fontSize: "11px",
                    fontWeight: "600",
                    lineHeight: "1.6",
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Action icons */}
            <div style={{ display: "flex", gap: "4px" }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                {showSearch && (
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                    placeholder="Search forms..."
                    style={{
                      position: "absolute",
                      right: "32px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "12px",
                      outline: "none",
                      width: "180px",
                      color: "#374151",
                    }}
                  />
                )}
                <button onClick={() => setShowSearch(s => !s)} style={iconBtnStyle}>
                  <SearchIcon />
                </button>
              </div>

              <button style={iconBtnStyle}><FilterIcon /></button>
              <button style={iconBtnStyle}><SortIcon /></button>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                <th style={thStyle("40px")}>
                  <input
                    type="checkbox"
                    checked={checkedIds.length === filteredForms.length && filteredForms.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: "pointer", accentColor: "#111827" }}
                  />
                </th>
                <th style={thStyle("180px")}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    Title <span style={{ color: "#9CA3AF", fontSize: "10px" }}>⇅</span>
                  </span>
                </th>
                <th style={thStyle()}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    Form ID <InfoIcon />
                  </span>
                </th>
                <th style={thStyle("120px")}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    Status <InfoIcon />
                  </span>
                </th>
                <th style={thStyle("120px")}>Submissions</th>
                <th style={thStyle("180px")}>Date Created</th>
                <th style={thStyle("120px", "right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 20px", color: "#9CA3AF", fontSize: "14px" }}>
                    {searchQuery ? "No forms match your search." : "No forms yet. Create your first form!"}
                  </td>
                </tr>
              ) : (
                filteredForms.map((form, idx) => {
                  const isChecked = checkedIds.includes(form.id);
                  const isMenuOpen = openMenuId === form.id;

                  return (
                    <tr
                      key={form.id}
                      style={{
                        borderBottom: idx < filteredForms.length - 1 ? "1px solid #F9FAFB" : "none",
                        backgroundColor: isChecked ? "#F9FAFB" : "white",
                        transition: "background 0.1s",
                      }}
                      onMouseOver={e => { if (!isChecked) e.currentTarget.style.backgroundColor = "#FAFAFA"; }}
                      onMouseOut={e => { if (!isChecked) e.currentTarget.style.backgroundColor = "white"; }}
                    >
                      {/* Checkbox */}
                      <td style={tdStyle("40px")}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(form.id)}
                          style={{ cursor: "pointer", accentColor: "#111827" }}
                        />
                      </td>

                      {/* Title */}
                      <td style={tdStyle("180px")}>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: "#111827" }}>
                          {form.title}
                        </span>
                      </td>

                      {/* Form ID */}
                      <td style={tdStyle()}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          fontSize: "12px",
                          color: "#374151",
                          letterSpacing: "0.01em",
                        }}>
                          {form.id}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={tdStyle("120px")}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          backgroundColor: "#D1FAE5",
                          color: "#065F46",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981", display: "inline-block" }} />
                          Active
                        </span>
                      </td>

                      {/* Submissions */}
                      <td style={tdStyle("120px")}>
                        <span style={{ fontSize: "13px", color: "#374151" }}>
                          {form.submissionCount ?? 0}
                        </span>
                      </td>

                      {/* Date Created */}
                      <td style={tdStyle("180px")}>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>
                          {formatDate(form.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdStyle("120px"), textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "2px", justifyContent: "flex-end", alignItems: "center" }}>
                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(form.id)}
                            title="Duplicate"
                            style={actionBtnStyle}
                          >
                            <CopyIcon />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/app/forms/${form.id}/edit`)}
                            title="Edit"
                            style={actionBtnStyle}
                          >
                            <EditIcon />
                          </button>

                          {/* More Menu */}
                          <div style={{ position: "relative" }}>
                            <button
                              onClick={() => setOpenMenuId(isMenuOpen ? null : form.id)}
                              title="More options"
                              style={actionBtnStyle}
                            >
                              <MoreIcon />
                            </button>

                            {isMenuOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: "0",
                                  top: "calc(100% + 4px)",
                                  background: "white",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: "8px",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                  zIndex: 50,
                                  minWidth: "140px",
                                  overflow: "hidden",
                                }}
                              >
                                <button
                                  onClick={() => { navigate(`/app/forms/${form.id}/edit`); setOpenMenuId(null); }}
                                  style={menuItemStyle}
                                >
                                  Edit form
                                </button>
                                <button
                                  onClick={() => { handleDuplicate(form.id); }}
                                  style={menuItemStyle}
                                >
                                  Duplicate
                                </button>
                                <div style={{ height: "1px", backgroundColor: "#F3F4F6" }} />
                                <button
                                  onClick={() => { setDeleteConfirmId(form.id); setOpenMenuId(null); }}
                                  style={{ ...menuItemStyle, color: "#EF4444" }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1px solid #F3F4F6",
          }}>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>
              Showing <strong style={{ color: "#111827" }}>{filteredForms.length}</strong> record{filteredForms.length !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button style={paginationBtnStyle}><ChevronLeftIcon /></button>
              <button style={paginationBtnStyle}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "380px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: "#111827" }}>Delete Form?</h3>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#6B7280", lineHeight: "1.5" }}>
              This will permanently delete the form and all its submissions. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: "8px 16px", background: "#F9FAFB", border: "1px solid #E5E7EB",
                  borderRadius: "7px", fontSize: "13px", cursor: "pointer", color: "#374151",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                style={{
                  padding: "8px 16px", background: "#EF4444", border: "none",
                  borderRadius: "7px", fontSize: "13px", cursor: "pointer", color: "white", fontWeight: "500",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
}

// Style helpers
const thStyle = (width, align = "left") => ({
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: "500",
  color: "#6B7280",
  textAlign: align,
  whiteSpace: "nowrap",
  width: width || "auto",
  userSelect: "none",
});

const tdStyle = (width, align = "left") => ({
  padding: "13px 12px",
  fontSize: "13px",
  color: "#374151",
  textAlign: align,
  width: width || "auto",
  verticalAlign: "middle",
});

const iconBtnStyle = {
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#6B7280",
  transition: "background 0.1s",
};

const actionBtnStyle = {
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "1px solid #E5E7EB",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#6B7280",
  transition: "all 0.1s",
};

const menuItemStyle = {
  display: "block",
  width: "100%",
  padding: "9px 14px",
  textAlign: "left",
  background: "none",
  border: "none",
  fontSize: "13px",
  color: "#374151",
  cursor: "pointer",
};

const paginationBtnStyle = {
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: "6px",
  cursor: "pointer",
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};