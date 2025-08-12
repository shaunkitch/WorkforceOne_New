'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FileUpload from '@/components/file-upload/file-upload'
import { 
  File, 
  Image, 
  FileText, 
  Download, 
  Eye,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Folder,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'

interface Document {
  id: string
  name: string
  size: number
  type: string
  url: string
  path: string
  uploaded_by: string
  folder: string
  created_at: string
  profiles?: {
    full_name: string
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  
  const supabase = createClient()

  const folders = [
    { id: 'all', name: 'All Documents', count: 0 },
    { id: 'documents', name: 'Documents', count: 0 },
    { id: 'images', name: 'Images', count: 0 },
    { id: 'contracts', name: 'Contracts', count: 0 },
    { id: 'reports', name: 'Reports', count: 0 },
    { id: 'templates', name: 'Templates', count: 0 }
  ]

  useEffect(() => {
    fetchDocuments()
  }, [selectedFolder, searchTerm])

  const fetchDocuments = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      let query = supabase
        .from('documents')
        .select(`
          *,
          profiles:uploaded_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedFolder !== 'all') {
        query = query.eq('folder', selectedFolder)
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (uploadedFiles: any[]) => {
    setDocuments(prev => [...uploadedFiles, ...prev])
    setShowUpload(false)
  }

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document')
    }
  }

  const viewDocument = (doc: Document) => {
    window.open(doc.url, '_blank')
  }

  const deleteDocument = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) throw dbError

      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-6 w-6 text-blue-600" />
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-600" />
    return <File className="h-6 w-6 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const folderCounts = folders.map(folder => ({
    ...folder,
    count: folder.id === 'all' 
      ? documents.length 
      : documents.filter(doc => doc.folder === folder.id).length
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your files and documents.</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <FileUpload 
          onUploadComplete={handleUploadComplete}
          folder={selectedFolder === 'all' ? 'documents' : selectedFolder}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {folderCounts.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                      selectedFolder === folder.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <span className="font-medium">{folder.name}</span>
                    <span className="text-sm text-gray-500">{folder.count}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search and Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents found</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        {getFileIcon(doc.type)}
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => viewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm mb-1 truncate">{doc.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(doc.size)} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">
                        By {doc.profiles?.full_name || 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {getFileIcon(doc.type)}
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.size)} • {format(new Date(doc.created_at), 'MMM d, yyyy')} • 
                            By {doc.profiles?.full_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => viewDocument(doc)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteDocument(doc)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}