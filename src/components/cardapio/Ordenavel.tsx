import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Lista que se reordena arrastando (mouse, toque e teclado: foco na alca, espaco para pegar, setas
 * para mover, espaco para soltar). As setas "subir/descer" continuam existindo como alternativa.
 */
export function ListaOrdenavel({
  ids,
  onReordenar,
  children,
}: {
  ids: string[];
  /** `ativo` foi solto sobre `alvo`. */
  onReordenar: (ativo: string, alvo: string) => void;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // No celular, segurar um instante para arrastar nao atrapalha a rolagem da pagina.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function fim(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) onReordenar(String(active.id), String(over.id));
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={fim}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Um item da lista. `children` recebe a alca de arrastar para colocar onde fizer sentido. */
export function Ordenavel({
  id,
  rotulo,
  as: Tag = "div",
  className,
  children,
}: {
  id: string;
  rotulo: string;
  as?: "div" | "li";
  className?: string;
  children: (alca: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const alca = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Arrastar para reordenar: ${rotulo}`}
      className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 xl:h-9"
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  );
  return (
    <Tag
      ref={setNodeRef as never}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-20 opacity-90 shadow-lg", className)}
    >
      {children(alca)}
    </Tag>
  );
}
