'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition
} from '@headlessui/react'
import { Textarea } from '@/components/ui/textarea'
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Filter,
  ChevronsUpDown,
  Check
} from 'lucide-react'
import { format } from 'date-fns'

interface TimeEntry {
  id: string
  start_time: string
  end_time?: string
  duration?: number
  description?: string
  project_id?: string
  task_id?: string
  is_billable: boolean
  status: string
  created_at: string
}

interface Project {
  id: string
  name: string
  status?: string
}

export default function TimeTrackingPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [description, setDescription] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [isBillable, setIsBillable] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [projectQuery, setProjectQuery] = useState('')
  const [manualProjectQuery, setManualProjectQuery] = useState('')
  
  // Manual entry states
  const [manualStartTime, setManualStartTime] = useState('')
  const [manualEndTime, setManualEndTime] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualProject, setManualProject] = useState('')

  // Filtered projects for search
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(projectQuery.toLowerCase())
  )
  const filteredManualProjects = projects.filter(project => 
    project.name.toLowerCase().includes(manualProjectQuery.toLowerCase())
  )

  // Find selected project objects
  const selectedProjectObj = projects.find(p => p.id === selectedProject)
  const selectedManualProjectObj = projects.find(p => p.id === manualProject)

  const supabase = createClient()

  useEffect(() => {
    fetchTimeEntries()
    fetchProjects()
    checkActiveTimer()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, startTime])

  const checkActiveTimer = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('status', 'active')
        .is('end_time', null)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setActiveEntryId(data.id)
        setStartTime(new Date(data.start_time))
        setIsRunning(true)
        setDescription(data.description || '')
        setSelectedProject(data.project_id || '')
        setIsBillable(data.is_billable)
      }
    } catch (error) {
      console.error('Error checking active timer:', error)
    }
  }

  const fetchTimeEntries = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setTimeEntries(data || [])
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .not('status', 'eq', 'cancelled')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const startTimer = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // If no profile or organization, get default organization
      let organizationId = profile?.organization_id
      
      if (!organizationId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        organizationId = defaultOrg?.id
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact your administrator.')
      }

      const now = new Date()
      const timeEntryData = {
        user_id: user.user.id,
        organization_id: organizationId,
        start_time: now.toISOString(),
        description: description,
        project_id: selectedProject || null,
        is_billable: isBillable,
        status: 'active'
      }

      console.log('Creating time entry:', timeEntryData)

      const { data, error } = await supabase
        .from('time_entries')
        .insert(timeEntryData)
        .select()
        .single()

      if (error) throw error

      console.log('Time entry created:', data)
      setActiveEntryId(data.id)
      setStartTime(now)
      setIsRunning(true)
      setCurrentTime(0)
    } catch (error) {
      console.error('Error starting timer:', error)
      alert('Failed to start timer. Please try again.')
    }
  }

  const pauseTimer = async () => {
    if (!activeEntryId) return

    try {
      const now = new Date()
      const duration = Math.floor((now.getTime() - (startTime?.getTime() || 0)) / 1000 / 60)

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: now.toISOString(),
          duration: duration,
          status: 'paused'
        })
        .eq('id', activeEntryId)

      if (error) throw error

      setIsRunning(false)
      fetchTimeEntries()
    } catch (error) {
      console.error('Error pausing timer:', error)
    }
  }

  const stopTimer = async () => {
    if (!activeEntryId) return

    try {
      const now = new Date()
      const duration = Math.floor((now.getTime() - (startTime?.getTime() || 0)) / 1000 / 60)

      const updateData = {
        end_time: now.toISOString(),
        duration: duration,
        status: 'completed'
      }

      console.log('Updating time entry to completed:', { activeEntryId, updateData })

      const { data, error } = await supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', activeEntryId)
        .select()
        .single()

      if (error) throw error

      console.log('Time entry completed:', data)

      setIsRunning(false)
      setActiveEntryId(null)
      setStartTime(null)
      setCurrentTime(0)
      setDescription('')
      setSelectedProject('')
      setIsBillable(false)
      fetchTimeEntries()
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  const addManualEntry = async () => {
    if (!manualStartTime || !manualEndTime) return

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // If no profile or organization, get default organization
      let organizationId = profile?.organization_id
      
      if (!organizationId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        organizationId = defaultOrg?.id
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact your administrator.')
      }

      const start = new Date(manualStartTime)
      const end = new Date(manualEndTime)
      const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)

      const manualEntryData = {
        user_id: user.user.id,
        organization_id: organizationId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration: duration,
        description: manualDescription,
        project_id: manualProject || null,
        is_billable: false,
        status: 'completed'
      }

      console.log('Creating manual time entry:', manualEntryData)

      const { data, error } = await supabase
        .from('time_entries')
        .insert(manualEntryData)
        .select()
        .single()

      if (error) throw error

      console.log('Manual time entry created:', data)

      // Reset form
      setManualStartTime('')
      setManualEndTime('')
      setManualDescription('')
      setManualProject('')
      setShowManualEntry(false)
      fetchTimeEntries()
    } catch (error) {
      console.error('Error adding manual entry:', error)
      alert('Failed to add manual entry. Please try again.')
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchTimeEntries()
    } catch (error) {
      console.error('Error deleting time entry:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <p className="text-gray-600">Track your work time and manage time entries.</p>
      </div>

      {/* Timer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
              {formatTime(currentTime)}
            </div>
            {isRunning && startTime && (
              <p className="text-sm text-gray-500">
                Started at {format(startTime, 'HH:mm:ss')}
              </p>
            )}
          </div>

          {/* Timer Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                disabled={isRunning}
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Combobox 
                value={selectedProject || null} 
                onChange={(value: string | null) => setSelectedProject(value || '')}
                disabled={isRunning}
              >
                <div className="relative mt-1">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                    <ComboboxInput
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      displayValue={(projectId: string) => selectedProjectObj?.name || ''}
                      onChange={(event) => setProjectQuery(event.target.value)}
                      placeholder="Search and select a project..."
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDown
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </ComboboxButton>
                  </div>
                  <Transition
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setProjectQuery('')}
                  >
                    <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                      {filteredProjects.length === 0 && projectQuery !== '' ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                          No projects found.
                        </div>
                      ) : (
                        filteredProjects.map((project) => (
                          <ComboboxOption
                            key={project.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={project.id}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? 'font-medium' : 'font-normal'
                                  }`}
                                >
                                  {project.name}
                                  {project.status && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({project.status})
                                    </span>
                                  )}
                                </span>
                                {selected ? (
                                  <span
                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                      active ? 'text-white' : 'text-blue-600'
                                    }`}
                                  >
                                    <Check className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </ComboboxOption>
                        ))
                      )}
                    </ComboboxOptions>
                  </Transition>
                </div>
              </Combobox>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="billable"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              disabled={isRunning}
              className="rounded"
            />
            <Label htmlFor="billable">Billable</Label>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center space-x-4">
            {!isRunning ? (
              <Button onClick={startTimer} size="lg" className="bg-green-600 hover:bg-green-700">
                <Play className="h-5 w-5 mr-2" />
                Start
              </Button>
            ) : (
              <>
                <Button onClick={pauseTimer} size="lg" variant="outline">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
                <Button onClick={stopTimer} size="lg" className="bg-red-600 hover:bg-red-700">
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Manual Entry
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowManualEntry(!showManualEntry)}
            >
              {showManualEntry ? 'Cancel' : 'Add Manual Entry'}
            </Button>
          </div>
        </CardHeader>
        {showManualEntry && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="manual-description">Description</Label>
              <Textarea
                id="manual-description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>
            <div>
              <Label htmlFor="manual-project">Project</Label>
              <Combobox value={manualProject || null} onChange={(value: string | null) => setManualProject(value || '')}>
                <div className="relative mt-1">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                    <ComboboxInput
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      displayValue={(projectId: string) => selectedManualProjectObj?.name || ''}
                      onChange={(event) => setManualProjectQuery(event.target.value)}
                      placeholder="Search and select a project..."
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDown
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </ComboboxButton>
                  </div>
                  <Transition
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setManualProjectQuery('')}
                  >
                    <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                      {filteredManualProjects.length === 0 && manualProjectQuery !== '' ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                          No projects found.
                        </div>
                      ) : (
                        filteredManualProjects.map((project) => (
                          <ComboboxOption
                            key={project.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={project.id}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? 'font-medium' : 'font-normal'
                                  }`}
                                >
                                  {project.name}
                                  {project.status && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({project.status})
                                    </span>
                                  )}
                                </span>
                                {selected ? (
                                  <span
                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                      active ? 'text-white' : 'text-blue-600'
                                    }`}
                                  >
                                    <Check className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </ComboboxOption>
                        ))
                      )}
                    </ComboboxOptions>
                  </Transition>
                </div>
              </Combobox>
            </div>
            <Button onClick={addManualEntry}>Add Entry</Button>
          </CardContent>
        )}
      </Card>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : timeEntries.length === 0 ? (
              <p className="text-center text-gray-500">No time entries yet.</p>
            ) : (
              timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {entry.description || 'No description'}
                      </span>
                      {entry.is_billable && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Billable
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        entry.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {format(new Date(entry.start_time), 'MMM d, yyyy HH:mm')}
                      {entry.end_time && (
                        <span> - {format(new Date(entry.end_time), 'HH:mm')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">
                      {entry.duration ? formatDuration(entry.duration) : 'Running...'}
                    </span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTimeEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}