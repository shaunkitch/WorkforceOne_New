// Simple drag and drop utility for report builder
export interface DragItem {
  id: string
  type: string
  data: any
}

export class DragDropManager {
  private draggedItem: DragItem | null = null
  private dropCallbacks: Map<string, (item: DragItem) => void> = new Map()

  startDrag(item: DragItem) {
    this.draggedItem = item
  }

  endDrag() {
    this.draggedItem = null
  }

  getDraggedItem(): DragItem | null {
    return this.draggedItem
  }

  registerDropZone(id: string, callback: (item: DragItem) => void) {
    this.dropCallbacks.set(id, callback)
  }

  unregisterDropZone(id: string) {
    this.dropCallbacks.delete(id)
  }

  handleDrop(dropZoneId: string): boolean {
    if (!this.draggedItem) return false
    
    const callback = this.dropCallbacks.get(dropZoneId)
    if (callback) {
      callback(this.draggedItem)
      this.endDrag()
      return true
    }
    
    return false
  }
}

export const dragDropManager = new DragDropManager()

// React hook for drag and drop functionality
export function useDragDrop() {
  const handleDragStart = (item: DragItem) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(item))
    dragDropManager.startDrag(item)
  }

  const handleDragEnd = () => {
    dragDropManager.endDrag()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (dropZoneId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    
    try {
      const data = e.dataTransfer.getData('text/plain')
      if (data) {
        const item: DragItem = JSON.parse(data)
        dragDropManager.startDrag(item)
      }
    } catch (error) {
      console.warn('Failed to parse drag data:', error)
    }
    
    dragDropManager.handleDrop(dropZoneId)
  }

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  }
}

// Utility for creating draggable elements
export const createDraggableProps = (item: DragItem) => ({
  draggable: true,
  onDragStart: (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(item))
    dragDropManager.startDrag(item)
  },
  onDragEnd: () => {
    dragDropManager.endDrag()
  }
})

// Utility for creating drop zones
export const createDropZoneProps = (dropZoneId: string, onDrop: (item: DragItem) => void) => {
  dragDropManager.registerDropZone(dropZoneId, onDrop)
  
  return {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      
      try {
        const data = e.dataTransfer.getData('text/plain')
        if (data) {
          const item: DragItem = JSON.parse(data)
          onDrop(item)
        }
      } catch (error) {
        console.warn('Failed to parse drag data:', error)
      }
      
      dragDropManager.endDrag()
    }
  }
}