import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  GripVertical,
  Copy,
  Trash2
} from 'lucide-react'

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  [key: string]: any
}

interface SortableFieldItemProps {
  field: FormField
  fieldTypes: any[]
  selectedField: FormField | null
  onSelect: (field: FormField) => void
  onDuplicate: (fieldId: string) => void
  onDelete: (fieldId: string) => void
  children: React.ReactNode
  previewMode: boolean
}

export default function SortableFieldItem({
  field,
  fieldTypes,
  selectedField,
  onSelect,
  onDuplicate,
  onDelete,
  children,
  previewMode
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 transition-all duration-200 cursor-pointer ${
        selectedField?.id === field.id && !previewMode
          ? 'ring-2 ring-blue-500 bg-blue-50/80 shadow-lg' 
          : 'border border-gray-200 hover:border-blue-300 hover:shadow-md'
      } ${isDragging ? 'shadow-2xl scale-105 rotate-2' : 'shadow-sm hover:shadow-lg'}`}
      onClick={() => !previewMode && onSelect(field)}
    >
      {!previewMode && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              {fieldTypes.find(ft => ft.id === field.type)?.name}
            </div>
            {field.required && (
              <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <span>Required</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(field.id)
              }}
              className="hover:bg-blue-50 hover:text-blue-600 transition-colors p-2 rounded-lg"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(field.id)
              }}
              className="hover:bg-red-50 hover:text-red-600 transition-colors p-2 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div>
        <Label className="text-base font-semibold text-gray-800 mb-3 block">
          {field.label}
          {field.required && <span className="text-red-500 ml-2 text-lg">*</span>}
        </Label>
        <div className="space-y-2">
          {children}
        </div>
      </div>
    </div>
  )
}