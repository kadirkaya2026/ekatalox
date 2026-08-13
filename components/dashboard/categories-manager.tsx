"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpFromLine,
  ChevronRight,
  FolderTree,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { CategoryBannerPanel } from "@/components/dashboard/category-banner-panel";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/categories/tree";
import type { Category, Tenant } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type OverPosition = "above" | "below" | "on";

interface RowProps {
  category: Category & { depth: number };
  tenant: Tenant;
  displayOrder: number;
  maxOrder: number;
  isDragging: boolean;
  isOver: boolean;
  overPosition: OverPosition;
  editingId: string | null;
  editingName: string;
  inlineParentId: string | null;
  inlineName: string;
  deleteConfirmId: string | null;
  bannerPanelId: string | null;
  pending: boolean;
  onStartEdit: (category: Category) => void;
  onSaveRename: (id: string) => void;
  onEditingNameChange: (value: string) => void;
  onCancelEdit: () => void;
  onToggleSub: (id: string) => void;
  onInlineNameChange: (value: string) => void;
  onCreateSub: (parentId: string) => void;
  onCancelSub: () => void;
  onStartDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onPromoteToRoot: (id: string) => void;
  onOrderCommit: (targetOrder: number) => void;
  onToggleBanner: (id: string) => void;
  onBannerSaved: (category: Category) => void;
  onCancelBanner: () => void;
}

function CategoryOrderInput({
  displayOrder,
  maxOrder,
  disabled,
  categoryName,
  onCommit,
}: {
  displayOrder: number;
  maxOrder: number;
  disabled?: boolean;
  categoryName: string;
  onCommit: (targetOrder: number) => void;
}) {
  const [draft, setDraft] = useState(String(displayOrder));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(displayOrder));
    }
  }, [displayOrder, isEditing]);

  function commit() {
    const parsed = Number.parseInt(draft, 10);

    if (!Number.isFinite(parsed) || parsed < 1 || parsed > maxOrder) {
      setDraft(String(displayOrder));
      setIsEditing(false);
      return;
    }

    onCommit(parsed);
    setIsEditing(false);
  }

  function cancel() {
    setDraft(String(displayOrder));
    setIsEditing(false);
  }

  return (
    <input
      type="number"
      min={1}
      max={maxOrder}
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      aria-label={`${categoryName} sırası`}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="w-14 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

// ─── SortableCategoryRow ──────────────────────────────────────────────────────

function SortableCategoryRow(props: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: props.category.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.35 : 1,
  };

  const isReparentTarget = props.isOver && props.overPosition === "on";
  const isAbove = props.isOver && props.overPosition === "above";
  const isBelow = props.isOver && props.overPosition === "below";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Reorder indicator — above */}
      {isAbove ? (
        <div className="mx-1 h-0.5 rounded-full bg-blue-400" />
      ) : null}

      {/* Main row */}
      <div
        className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors md:flex-row md:flex-wrap md:items-center md:justify-between ${
          isReparentTarget
            ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300"
            : "border-slate-100 bg-slate-50"
        }`}
      >
        <div className="flex min-w-0 items-start gap-2">
          <CategoryOrderInput
            displayOrder={props.displayOrder}
            maxOrder={props.maxOrder}
            disabled={props.pending}
            categoryName={props.category.name}
            onCommit={props.onOrderCommit}
          />

          {/* Drag handle */}
          <button
            {...listeners}
            className="mt-1 cursor-grab touch-none rounded p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing"
            tabIndex={-1}
            aria-label="Sürükle"
          >
            <GripVertical className="size-4" />
          </button>

          <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
            <FolderTree className="size-4" />
          </div>

          <div className="min-w-0">
            <p className="flex items-center gap-2">
              {props.category.depth > 0 ? (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <ChevronRight className="size-4" />
                  <span className="text-sm">Alt kategori</span>
                </span>
              ) : (
                <span className="text-sm text-emerald-700">Ana kategori</span>
              )}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {"— ".repeat(props.category.depth)}
              {props.category.name}
            </p>

          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="secondary"
            className={`h-8 gap-1.5 px-3 text-xs ${
              props.category.banner_item?.image_url
                ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                : ""
            }`}
            onClick={() => props.onToggleBanner(props.category.id)}
            disabled={props.pending}
          >
            <ImageIcon className="size-3" />
            Banner
          </Button>
          <Button
            variant="secondary"
            className="h-8 gap-1.5 px-3 text-xs"
            onClick={() => props.onToggleSub(props.category.id)}
            disabled={props.pending}
          >
            <Plus className="size-3" />
            Alt ekle
          </Button>
          <Button
            variant="secondary"
            className="h-8 gap-1.5 px-3 text-xs"
            onClick={() => props.onStartEdit(props.category)}
            disabled={props.pending}
          >
            <Pencil className="size-3" />
            Düzenle
          </Button>
          {props.category.depth > 0 ? (
            <Button
              variant="secondary"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={() => props.onPromoteToRoot(props.category.id)}
              disabled={props.pending}
            >
              <ArrowUpFromLine className="size-3" />
              Ana yap
            </Button>
          ) : null}
          <Button
            variant="secondary"
            className="h-8 gap-1.5 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => props.onStartDelete(props.category.id)}
            disabled={props.pending}
          >
            <Trash2 className="size-3" />
            Sil
          </Button>
        </div>
      </div>

      {/* Inline rename */}
      {props.editingId === props.category.id ? (
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <Input
            value={props.editingName}
            onChange={(e) => props.onEditingNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); props.onSaveRename(props.category.id); }
              if (e.key === "Escape") props.onCancelEdit();
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button className="h-8 shrink-0 px-3 text-xs" onClick={() => props.onSaveRename(props.category.id)} disabled={props.pending || !props.editingName.trim()}>Kaydet</Button>
          <Button variant="secondary" className="h-8 shrink-0 px-3 text-xs" onClick={props.onCancelEdit} disabled={props.pending}>İptal</Button>
        </div>
      ) : null}

      {/* Delete confirm */}
      {props.deleteConfirmId === props.category.id ? (
        <div className="mt-1 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
          <p className="flex-1 text-sm text-red-800">
            <strong>"{props.category.name}"</strong> silinecek. Emin misiniz?
          </p>
          <Button variant="danger" className="h-8 shrink-0 px-3 text-xs" onClick={() => props.onConfirmDelete(props.category.id)} disabled={props.pending}>Evet, sil</Button>
          <Button variant="secondary" className="h-8 shrink-0 px-3 text-xs" onClick={props.onCancelDelete} disabled={props.pending}>İptal</Button>
        </div>
      ) : null}

      {/* Inline sub-add */}
      {props.inlineParentId === props.category.id ? (
        <div
          className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3"
          style={{ marginLeft: `${(props.category.depth + 1) * 20}px` }}
        >
          <Input
            placeholder={`"${props.category.name}" altına alt kategori adı`}
            value={props.inlineName}
            onChange={(e) => props.onInlineNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); props.onCreateSub(props.category.id); }
              if (e.key === "Escape") props.onCancelSub();
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button className="h-8 shrink-0 px-3 text-xs" onClick={() => props.onCreateSub(props.category.id)} disabled={props.pending || !props.inlineName.trim()}>Kaydet</Button>
          <Button variant="secondary" className="h-8 shrink-0 px-3 text-xs" onClick={props.onCancelSub} disabled={props.pending}>İptal</Button>
        </div>
      ) : null}

      {props.bannerPanelId === props.category.id ? (
        <div className="mt-1" style={{ marginLeft: `${props.category.depth * 20}px` }}>
          <PlanFeatureGate
            feature="banner_settings"
            plan={props.tenant.plan}
            companyName={props.tenant.company_name}
          >
            <CategoryBannerPanel
              category={props.category}
              disabled={props.pending}
              onSaved={props.onBannerSaved}
              onCancel={props.onCancelBanner}
            />
          </PlanFeatureGate>
        </div>
      ) : null}

      {/* Reorder indicator — below */}
      {isBelow ? (
        <div className="mx-1 h-0.5 rounded-full bg-blue-400" />
      ) : null}
    </div>
  );
}

// ─── CategoriesManager ────────────────────────────────────────────────────────

export function CategoriesManager({
  tenant,
  initialCategories,
}: {
  tenant: Tenant;
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Inline states
  const [inlineParentId, setInlineParentId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bannerPanelId, setBannerPanelId] = useState<string | null>(null);

  // DnD states
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPosition, setOverPosition] = useState<OverPosition>("on");
  const overPositionRef = useRef<OverPosition>("on");

  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    // Refresh the route cache after a successful change (non-empty success
    // message) so revisiting this page shows fresh data. Empty clears and
    // errors are skipped.
    if (text && type === "success") {
      router.refresh();
    }
  }

  function closeAllInline() {
    setInlineParentId(null);
    setInlineName("");
    setEditingId(null);
    setEditingName("");
    setDeleteConfirmId(null);
    setBannerPanelId(null);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showMessage("");
    startTransition(async () => {
      const res = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id, parent_id: null, name }),
      });
      const result = await res.json();
      if (!res.ok) { showMessage(result.error ?? "Kategori eklenemedi.", "error"); return; }
      setCategories((c) => [result.category as Category, ...c]);
      setName("");
      showMessage("Yeni kategori eklendi.");
    });
  }

  function createSubCategory(parentId: string) {
    if (!inlineName.trim()) return;
    showMessage("");
    startTransition(async () => {
      const res = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id, parent_id: parentId, name: inlineName.trim() }),
      });
      const result = await res.json();
      if (!res.ok) { showMessage(result.error ?? "Alt kategori eklenemedi.", "error"); return; }
      setCategories((c) => [...c, result.category as Category]);
      setInlineParentId(null);
      setInlineName("");
      showMessage("Alt kategori eklendi.");
    });
  }

  function saveRename(id: string) {
    if (!editingName.trim()) return;
    showMessage("");
    startTransition(async () => {
      const res = await fetch("/api/tenant/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editingName.trim() }),
      });
      const result = await res.json();
      if (!res.ok) { showMessage(result.error ?? "İsim güncellenemedi.", "error"); return; }
      setCategories((c) => c.map((cat) => cat.id === id ? { ...cat, name: editingName.trim() } : cat));
      setEditingId(null);
      setEditingName("");
      showMessage("Kategori adı güncellendi.");
    });
  }

  function promoteToRoot(id: string) {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    const rootCategories = categories.filter((c) => !c.parent_id);
    const maxOrder = rootCategories.reduce((max, c) => Math.max(max, c.display_order), -1);

    const updated = categories.map((c) =>
      c.id === id ? { ...c, parent_id: null, display_order: maxOrder + 1 } : c,
    );
    setCategories(updated);

    startTransition(async () => {
      const res = await fetch("/api/tenant/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updated.map((c) => ({
            id: c.id,
            parent_id: c.parent_id ?? null,
            display_order: c.display_order,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        showMessage(result.error ?? "İşlem başarısız.", "error");
      } else {
        showMessage(`"${category.name}" ana kategori yapıldı.`);
      }
    });
  }

  function deleteCategory(id: string) {
    showMessage("");
    startTransition(async () => {
      const res = await fetch("/api/tenant/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok) { showMessage(result.error ?? "Kategori silinemedi.", "error"); setDeleteConfirmId(null); return; }
      setCategories((c) => c.filter((cat) => cat.id !== id));
      setDeleteConfirmId(null);
      showMessage("Kategori silindi.");
    });
  }

  function applyFlatListOrder(
    reordered: (Category & { depth: number })[],
    options?: { showSuccessMessage?: boolean },
  ) {
    const updated = categories.map((cat) => {
      const newOrder = reordered.findIndex((c) => c.id === cat.id);
      return newOrder !== -1 ? { ...cat, display_order: newOrder } : cat;
    });

    setCategories(updated);
    persistCategories(updated, options);
  }

  function persistCategories(
    updated: Category[],
    options?: { showSuccessMessage?: boolean },
  ) {
    startTransition(async () => {
      const items = updated.map((c) => ({
        id: c.id,
        parent_id: c.parent_id ?? null,
        display_order: c.display_order,
      }));
      const res = await fetch("/api/tenant/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await res.json();
      if (!res.ok) {
        showMessage(result.error ?? "Sıra kaydedilemedi.", "error");
      } else if (options?.showSuccessMessage) {
        showMessage("Kategori sırası güncellendi.");
      }
    });
  }

  function handleSetCategoryOrder(categoryId: string, targetOrder: number) {
    const flat = flatCategories;
    const sourceIndex = flat.findIndex((c) => c.id === categoryId);

    if (sourceIndex < 0) {
      return;
    }

    const targetIndex =
      Math.min(Math.max(1, Math.floor(targetOrder)), flat.length) - 1;

    if (targetIndex === sourceIndex) {
      return;
    }

    const reordered = arrayMove(flat, sourceIndex, targetIndex);
    applyFlatListOrder(reordered, { showSuccessMessage: true });
  }

  // ── DnD Handlers ──────────────────────────────────────────────────────────

  function computePosition(active: DragMoveEvent["active"], over: NonNullable<DragMoveEvent["over"]>): OverPosition {
    const translatedRect = active.rect.current.translated;
    if (!translatedRect) return "on";

    const activeMidY = translatedRect.top + translatedRect.height / 2;
    const { top, height } = over.rect;
    const relY = activeMidY - top;

    // Üst/alt %20 → reorder; orta %60 → reparent
    if (relY < height * 0.2) return "above";
    if (relY > height * 0.8) return "below";
    return "on";
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
    closeAllInline();
  }

  function handleDragMove({ active, over }: DragMoveEvent) {
    if (!over || over.id === active.id) return;

    const pos = computePosition(active, over);
    setOverPosition(pos);
    overPositionRef.current = pos;
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || over.id === active.id) { setOverId(null); return; }

    setOverId(over.id as string);

    const pos = computePosition(active, over);
    setOverPosition(pos);
    overPositionRef.current = pos;
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverId(null);

    if (!over || over.id === active.id) return;

    const activeCategory = categories.find((c) => c.id === active.id);
    const overCategory = categories.find((c) => c.id === over.id);
    if (!activeCategory || !overCategory) return;

    let updated: Category[];

    if (overPositionRef.current === "on") {
      // Reparent: make active a child of over
      if (activeCategory.id === overCategory.id) return;
      // Prevent making a parent a child of its own descendant
      const isDescendant = (parentId: string, targetId: string): boolean => {
        const children = categories.filter((c) => c.parent_id === parentId);
        return children.some((c) => c.id === targetId || isDescendant(c.id, targetId));
      };
      if (isDescendant(activeCategory.id, overCategory.id)) {
        showMessage("Bir kategori kendi alt kategorisinin içine taşınamaz.", "error");
        return;
      }

      const siblings = categories.filter((c) => c.parent_id === overCategory.id && c.id !== activeCategory.id);
      const maxOrder = siblings.reduce((max, c) => Math.max(max, c.display_order), -1);
      updated = categories.map((c) =>
        c.id === activeCategory.id
          ? { ...c, parent_id: overCategory.id, display_order: maxOrder + 1 }
          : c,
      );
    } else {
      // Reorder within the flat list
      const flat = flatCategories;
      const oldIndex = flat.findIndex((c) => c.id === active.id);
      const overIndex = flat.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || overIndex === -1) return;

      const targetIndex = overPositionRef.current === "below" ? overIndex + 1 : overIndex;
      const reordered = arrayMove(flat, oldIndex, targetIndex > oldIndex ? targetIndex - 1 : targetIndex);

      applyFlatListOrder(reordered);
      return;
    }

    setCategories(updated);
    persistCategories(updated);
  }

  const activeCategory = activeId ? flatCategories.find((c) => c.id === activeId) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left: create root */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Ana kategori ekle</h2>
        <p className="mt-1 text-sm text-slate-600">
          Üst düzey yeni bir kategori oluşturun. Alt kategoriler için listeden
          "+ Alt ekle" butonunu kullanın.
        </p>

        <form onSubmit={createCategory} className="mt-5 grid gap-3">
          <Input
            placeholder="Örn. Telefon, Tablet, Aksesuar"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kategori ekle"}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Sürükle &amp; bırak</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            <li>• Satırı <strong>sürükleyip bırakın</strong> → sırayı değiştirin</li>
            <li>• Sol taraftaki <strong>sıra kutucuğuna numara yazarak</strong> da sıralayın</li>
            <li>• Bir kategorinin <strong>ortasına bırakın</strong> → alt kategori yapın</li>
          </ul>
        </div>
      </Card>

      {/* Right: list */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aktif kategoriler</h2>
            <p className="mt-1 text-sm text-slate-600">
              {tenant.company_name} • {tenant.subdomain}.ekatalox.com
            </p>
          </div>
          <Badge className="bg-slate-100 text-slate-700">
            {categories.length} kategori
          </Badge>
        </div>

        {message ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              messageType === "error"
                ? "border-red-100 bg-red-50 text-red-800"
                : "border-emerald-100 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flatCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {flatCategories.map((category, index) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    tenant={tenant}
                    displayOrder={index + 1}
                    maxOrder={flatCategories.length}
                    isDragging={activeId === category.id}
                    isOver={overId === category.id}
                    overPosition={overPosition}
                    editingId={editingId}
                    editingName={editingName}
                    inlineParentId={inlineParentId}
                    inlineName={inlineName}
                    deleteConfirmId={deleteConfirmId}
                    bannerPanelId={bannerPanelId}
                    pending={pending}
                    onStartEdit={(cat) => { closeAllInline(); setEditingId(cat.id); setEditingName(cat.name); }}
                    onSaveRename={saveRename}
                    onEditingNameChange={setEditingName}
                    onCancelEdit={() => { setEditingId(null); setEditingName(""); }}
                    onToggleSub={(id) => {
                      if (inlineParentId === id) { setInlineParentId(null); setInlineName(""); }
                      else { closeAllInline(); setInlineParentId(id); }
                    }}
                    onInlineNameChange={setInlineName}
                    onCreateSub={createSubCategory}
                    onCancelSub={() => { setInlineParentId(null); setInlineName(""); }}
                    onStartDelete={(id) => { closeAllInline(); setDeleteConfirmId(id); }}
                    onConfirmDelete={deleteCategory}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    onPromoteToRoot={promoteToRoot}
                    onOrderCommit={(targetOrder) =>
                      handleSetCategoryOrder(category.id, targetOrder)
                    }
                    onToggleBanner={(id) => {
                      if (bannerPanelId === id) {
                        setBannerPanelId(null);
                        return;
                      }

                      setInlineParentId(null);
                      setInlineName("");
                      setEditingId(null);
                      setEditingName("");
                      setDeleteConfirmId(null);
                      setBannerPanelId(id);
                    }}
                    onBannerSaved={(updatedCategory) => {
                      setCategories((current) =>
                        current.map((cat) =>
                          cat.id === updatedCategory.id ? updatedCategory : cat,
                        ),
                      );
                      showMessage(`"${updatedCategory.name}" banner ayarları güncellendi.`);
                    }}
                    onCancelBanner={() => setBannerPanelId(null)}
                  />
                ))}

                {flatCategories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Henüz kategori yok. Soldaki formdan ilk kategorinizi ekleyin.
                  </p>
                ) : null}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
              {activeCategory ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
                  <GripVertical className="size-4 text-slate-400" />
                  <FolderTree className="size-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-800">
                    {activeCategory.name}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </Card>
    </div>
  );
}
