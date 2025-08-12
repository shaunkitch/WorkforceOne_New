import { createClient } from '@/lib/supabase/client'

export interface TriggerEvent {
  trigger_type: string
  event_source: string
  event_data: any
  organization_id: string
}

export class WorkflowTriggerEngine {
  private supabase = createClient()

  async triggerWorkflow(event: TriggerEvent) {
    try {
      const { data, error } = await this.supabase.rpc('enhanced_trigger_workflow', {
        p_trigger_type: event.trigger_type,
        p_event_source: event.event_source,
        p_event_data: event.event_data,
        p_organization_id: event.organization_id
      })

      if (error) {
        console.error('Error triggering workflow:', error)
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        result: data?.[0] || { instances_created: 0, templates_matched: 0 }
      }
    } catch (error) {
      console.error('Unexpected error triggering workflow:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  async processActionQueue() {
    try {
      const { data, error } = await this.supabase.rpc('process_workflow_action_queue')

      if (error) {
        console.error('Error processing action queue:', error)
        return { success: false, error: error.message }
      }

      return { success: true, processed_count: data || 0 }
    } catch (error) {
      console.error('Unexpected error processing action queue:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  // Common trigger scenarios
  async triggerAttendanceEvent(organizationId: string, employeeId: string, eventType: 'check_in' | 'check_out' | 'late', additionalData: any = {}) {
    return this.triggerWorkflow({
      trigger_type: 'attendance_event',
      event_source: 'attendance',
      event_data: {
        type: eventType,
        employee_id: employeeId,
        timestamp: new Date().toISOString(),
        ...additionalData
      },
      organization_id: organizationId
    })
  }

  async triggerLeaveEvent(organizationId: string, employeeId: string, eventType: 'request' | 'approval' | 'rejection', leaveData: any = {}) {
    return this.triggerWorkflow({
      trigger_type: 'leave_event',
      event_source: 'leave',
      event_data: {
        type: eventType,
        employee_id: employeeId,
        timestamp: new Date().toISOString(),
        ...leaveData
      },
      organization_id: organizationId
    })
  }

  async triggerTaskEvent(organizationId: string, employeeId: string, eventType: 'created' | 'assigned' | 'completed' | 'overdue', taskData: any = {}) {
    return this.triggerWorkflow({
      trigger_type: 'task_event',
      event_source: 'tasks',
      event_data: {
        type: eventType,
        employee_id: employeeId,
        timestamp: new Date().toISOString(),
        ...taskData
      },
      organization_id: organizationId
    })
  }

  async triggerFormEvent(organizationId: string, employeeId: string, eventType: 'submitted' | 'reviewed' | 'approved', formData: any = {}) {
    return this.triggerWorkflow({
      trigger_type: 'form_event',
      event_source: 'forms',
      event_data: {
        type: eventType,
        employee_id: employeeId,
        timestamp: new Date().toISOString(),
        ...formData
      },
      organization_id: organizationId
    })
  }
}

export const workflowTriggerEngine = new WorkflowTriggerEngine()