"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, pointerWithin, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GALLERY_PLACEMENTS, PLACEMENT_LABELS, type GalleryPhoto, type GalleryPlacement } from "@/lib/gallery-rules";
import { moveGalleryPhoto } from "@/lib/gallery-order";

type Props = {
  photos: GalleryPhoto[];
  homeLimit: number;
  disabled: boolean;
  selectedId: string | null;
  filter: string;
  onFilter: (value: string) => void;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => Promise<boolean>;
  onPlacement: (photo: GalleryPhoto, placement: GalleryPlacement) => Promise<boolean>;
};
const collision: CollisionDetection = args => args.pointerCoordinates ? pointerWithin(args) : closestCenter(args);

function Destination({ placement, photos, disabled, onFilter }: { placement: GalleryPlacement; photos: GalleryPhoto[]; disabled: boolean; onFilter: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `destination-${placement}`, disabled });
  const first = photos.find(photo => photo.published) ?? photos[0];
  return <div ref={setNodeRef} className={`admin-photo-destination${isOver ? " is-over" : ""}`}>
    <button type="button" onClick={onFilter} disabled={disabled} aria-label={`Mostrar ${PLACEMENT_LABELS[placement]}`}>
      {first ? <Image src={first.src} alt="" width={first.width} height={first.height} sizes="90px" /> : <span className="admin-photo-empty">+</span>}
      <span><strong>{PLACEMENT_LABELS[placement]}</strong><small>{photos.length} foto(s) · solte aqui</small></span>
    </button>
  </div>;
}

function Tile({ photo, position, homePosition, selected, disabled, onSelect }: { photo: GalleryPhoto; position: number; homePosition: number; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id, disabled });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`admin-photo-tile${isDragging ? " is-dragging" : ""}${selected ? " is-selected" : ""}${!photo.published ? " is-hidden" : ""}`}>
    <button ref={setActivatorNodeRef} type="button" className="admin-photo-drag" {...attributes} {...listeners} aria-label={`Arrastar ${photo.alt}`} disabled={disabled}>
      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width:600px) 40vw, 160px" draggable={false} />
      <span className="admin-photo-grip" aria-hidden="true">⠿</span>
      <span className="admin-photo-number">{position}</span>
    </button>
    <span className={`admin-photo-badge${homePosition >= 0 ? " is-home" : ""}`}>{!photo.published ? "Oculta" : homePosition >= 0 ? `Home · ${homePosition + 1}` : PLACEMENT_LABELS[photo.placement]}</span>
    <button className="admin-photo-select" type="button" onClick={onSelect} aria-pressed={selected} disabled={disabled}>{selected ? "Editando" : "Editar foto"}</button>
  </article>;
}

export default function AdminGalleryBoard({ photos, homeLimit, disabled, selectedId, filter, onFilter, onSelect, onReorder, onPlacement }: Props) {
  const [order, setOrder] = useState(photos);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const displayed = order.filter(photo => filter === "ALL" || photo.placement === filter);
  const homeIds = order.filter(photo => photo.published && photo.placement === "GALLERY").slice(0, homeLimit).map(photo => photo.id);
  const active = order.find(photo => photo.id === activeId);
  const blocked = disabled || saving;

  async function finish({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id || blocked || locked.current) return;
    const photo = order.find(item => item.id === active.id);
    if (!photo) return;
    locked.current = true;
    setSaving(true);
    const previous = order;
    try {
      const destination = GALLERY_PLACEMENTS.find(value => over.id === `destination-${value}`);
      if (destination) {
        if (destination !== photo.placement) await onPlacement(photo, destination);
      } else {
        const next = moveGalleryPhoto(order, displayed.map(item => item.id), photo.id, String(over.id));
        if (next !== order) {
          setOrder(next);
          if (!await onReorder(next.map(item => item.id))) setOrder(previous);
        }
      }
    } catch { setOrder(previous); }
    finally { locked.current = false; setSaving(false); }
  }

  return <section className="admin-form-sheet admin-photo-board" aria-label="Organizar fotos visualmente">
    <h2>Organize arrastando</h2>
    <p>Arraste uma miniatura até a posição desejada. Para mudar onde aparece, solte em um dos espaços abaixo. Cada movimento é salvo automaticamente.</p>
    <p className="admin-photo-tip">No celular, arraste pela foto e role pela área ao redor. Pelo teclado: foque a foto, pressione espaço, use as setas e pressione espaço para soltar; Esc cancela.</p>
    <DndContext id="admin-gallery-board" sensors={sensors} collisionDetection={collision} onDragStart={event => setActiveId(String(event.active.id))} onDragCancel={() => setActiveId(null)} onDragEnd={finish}
      accessibility={{ screenReaderInstructions: { draggable: "Pressione espaço para pegar a foto, setas para mover, espaço para soltar e Escape para cancelar." }, announcements: {
        onDragStart: () => "Foto selecionada para mover.",
        onDragOver: ({ over }) => over ? "Foto sobre um novo destino." : "Foto fora dos destinos.",
        onDragEnd: ({ over }) => over ? "Foto solta. Salvando alteração." : "Movimento cancelado.",
        onDragCancel: () => "Movimento cancelado.",
      } }}>
      <div className="admin-photo-destinations">{GALLERY_PLACEMENTS.map(placement => <Destination key={placement} placement={placement} photos={order.filter(photo => photo.placement === placement)} disabled={blocked} onFilter={() => onFilter(placement)} />)}</div>
      <p className="admin-photo-tip">Capa, história e transição recebem uma foto por vez. A anterior volta para a galeria ao ser substituída. Ocultas continuam ocultas ao mudar de espaço.</p>
      <div className="admin-filters"><label>Visualizar<select value={filter} disabled={blocked || activeId !== null} onChange={event => onFilter(event.target.value)}><option value="ALL">Todos os espaços</option>{GALLERY_PLACEMENTS.map(value => <option key={value} value={value}>{PLACEMENT_LABELS[value]}</option>)}</select></label><span role="status">{saving ? "Salvando posição…" : `${displayed.length} foto(s) · selo Home indica as primeiras ${homeLimit} fotos do álbum`}</span></div>
      <SortableContext items={displayed.map(photo => photo.id)} strategy={rectSortingStrategy}>
        <div className="admin-photo-grid">{displayed.map((photo, index) => <Tile key={photo.id} photo={photo} position={index + 1} homePosition={homeIds.indexOf(photo.id)} selected={selectedId === photo.id} disabled={blocked} onSelect={() => onSelect(photo.id)} />)}</div>
      </SortableContext>
      {!displayed.length && <p className="admin-photo-tip">Nenhuma foto neste espaço. Escolha “Todos os espaços” para encontrar uma foto e arrastá-la para cá.</p>}
      <DragOverlay>{active ? <div className="admin-photo-overlay"><Image src={active.src} alt={active.alt} width={active.width} height={active.height} sizes="140px" /></div> : null}</DragOverlay>
    </DndContext>
  </section>;
}
