import { createClient } from '@/lib/supabase/client'
import { logger, devLog } from './utils/logger'

export interface NotificationPayload {
  type: 'slack' | 'teams'
  event: string
  data: Record<string, any>
  channel?: string
}

export interface SlackMessage {
  text: string
  channel?: string
  username?: string
  icon_emoji?: string
  blocks?: any[]
  attachments?: any[]
}

export interface TeamsMessage {
  "@type": "MessageCard"
  "@context": "http://schema.org/extensions"
  themeColor?: string
  summary: string
  sections?: any[]
  potentialAction?: any[]
}

export class NotificationService {
  private supabase = createClient()
  private slackWebhook: string | null = null
  private teamsWebhook: string | null = null
  private templates: Map<string, string> = new Map()

  async initialize(organizationId: string) {
    // In a real implementation, this would fetch configuration from the database
    // For now, we'll use environment variables or hardcoded values
    this.loadTemplates()
  }

  private loadTemplates() {
    // Slack templates
    this.templates.set('slack.attendance.late', 
      `:warning: *Late Check-in Alert*\n:bust_in_silhouette: Employee: {{employee_name}}\n:clock10: Check-in Time: {{check_in_time}}\n:hourglass: Late by: {{late_minutes}} minutes`
    )
    
    this.templates.set('slack.leave.request',
      `:palm_tree: *New Leave Request*\n:bust_in_silhouette: Employee: {{employee_name}}\n:calendar: Dates: {{start_date}} to {{end_date}}\n:memo: Type: {{leave_type}}\n:link: <{{approval_link}}|Review Request>`
    )
    
    this.templates.set('slack.task.overdue',
      `:rotating_light: *Task Overdue*\n:clipboard: Task: {{task_title}}\n:bust_in_silhouette: Assigned to: {{assignee_name}}\n:calendar: Due Date: {{due_date}}\n:chart_with_upwards_trend: Priority: {{priority}}`
    )
    
    this.templates.set('slack.form.submitted',
      `:inbox_tray: *New Form Submission*\n:page_facing_up: Form: {{form_name}}\n:bust_in_silhouette: Submitted by: {{submitter_name}}\n:clock3: Time: {{submission_time}}\n:link: <{{view_link}}|View Submission>`
    )

    // Teams templates
    this.templates.set('teams.attendance.late',
      `**Late Check-in Alert** ⚠️\n\n**Employee:** {{employee_name}}\n**Check-in Time:** {{check_in_time}}\n**Late by:** {{late_minutes}} minutes`
    )
    
    this.templates.set('teams.leave.request',
      `**New Leave Request** 🌴\n\n**Employee:** {{employee_name}}\n**Dates:** {{start_date}} to {{end_date}}\n**Type:** {{leave_type}}\n\n[Review Request]({{approval_link}})`
    )
    
    this.templates.set('teams.task.overdue',
      `**Task Overdue** 🚨\n\n**Task:** {{task_title}}\n**Assigned to:** {{assignee_name}}\n**Due Date:** {{due_date}}\n**Priority:** {{priority}}`
    )
    
    this.templates.set('teams.form.submitted',
      `**New Form Submission** 📥\n\n**Form:** {{form_name}}\n**Submitted by:** {{submitter_name}}\n**Time:** {{submission_time}}\n\n[View Submission]({{view_link}})`
    )
  }

  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    let result = template
    
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    })
    
    return result
  }

  async sendSlackNotification(event: string, data: Record<string, any>, channel?: string): Promise<boolean> {
    try {
      if (!this.slackWebhook) {
        console.warn('Slack webhook not configured')
        return false
      }

      const template = this.templates.get(`slack.${event}`)
      if (!template) {
        console.warn(`No template found for Slack event: ${event}`)
        return false
      }

      const text = this.replaceTemplateVariables(template, data)
      
      const slackMessage: SlackMessage = {
        text,
        channel: channel || '#general',
        username: 'WorkforceOne',
        icon_emoji: ':briefcase:'
      }

      // Add rich formatting blocks for better presentation
      if (event === 'attendance.late') {
        slackMessage.blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Late Check-in Alert ⚠️'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Employee:*\n${data.employee_name}`
              },
              {
                type: 'mrkdwn',
                text: `*Check-in Time:*\n${data.check_in_time}`
              },
              {
                type: 'mrkdwn',
                text: `*Late by:*\n${data.late_minutes} minutes`
              },
              {
                type: 'mrkdwn',
                text: `*Department:*\n${data.department || 'N/A'}`
              }
            ]
          }
        ]
      } else if (event === 'leave.request') {
        slackMessage.blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'New Leave Request 🌴'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Employee:*\n${data.employee_name}`
              },
              {
                type: 'mrkdwn',
                text: `*Type:*\n${data.leave_type}`
              },
              {
                type: 'mrkdwn',
                text: `*Start Date:*\n${data.start_date}`
              },
              {
                type: 'mrkdwn',
                text: `*End Date:*\n${data.end_date}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Reason:* ${data.reason || 'No reason provided'}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Review Request'
                },
                style: 'primary',
                url: data.approval_link
              }
            ]
          }
        ]
      }

      // In a real implementation, this would make an HTTP POST to the webhook
      devLog('Sending Slack notification', slackMessage);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return true
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
      return false
    }
  }

  async sendTeamsNotification(event: string, data: Record<string, any>): Promise<boolean> {
    try {
      if (!this.teamsWebhook) {
        console.warn('Teams webhook not configured')
        return false
      }

      const template = this.templates.get(`teams.${event}`)
      if (!template) {
        console.warn(`No template found for Teams event: ${event}`)
        return false
      }

      const text = this.replaceTemplateVariables(template, data)
      
      const teamsMessage: TeamsMessage = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "0076D7",
        summary: text.split('\n')[0], // First line as summary
        sections: []
      }

      // Add rich formatting for different event types
      if (event === 'attendance.late') {
        teamsMessage.themeColor = "FF6B6B" // Red for alerts
        teamsMessage.sections = [
          {
            activityTitle: "Late Check-in Alert",
            activitySubtitle: `${data.employee_name} checked in late`,
            activityImage: "https://example.com/late-icon.png",
            facts: [
              {
                name: "Employee",
                value: data.employee_name
              },
              {
                name: "Check-in Time",
                value: data.check_in_time
              },
              {
                name: "Late by",
                value: `${data.late_minutes} minutes`
              },
              {
                name: "Department",
                value: data.department || "N/A"
              }
            ],
            markdown: true
          }
        ]
      } else if (event === 'leave.request') {
        teamsMessage.themeColor = "4ECDC4" // Teal for leave
        teamsMessage.sections = [
          {
            activityTitle: "New Leave Request",
            activitySubtitle: `${data.employee_name} has requested leave`,
            facts: [
              {
                name: "Employee",
                value: data.employee_name
              },
              {
                name: "Leave Type",
                value: data.leave_type
              },
              {
                name: "Duration",
                value: `${data.start_date} to ${data.end_date}`
              },
              {
                name: "Reason",
                value: data.reason || "No reason provided"
              }
            ],
            markdown: true
          }
        ]
        
        teamsMessage.potentialAction = [
          {
            "@type": "OpenUri",
            name: "Review Request",
            targets: [
              {
                os: "default",
                uri: data.approval_link
              }
            ]
          }
        ]
      }

      // In a real implementation, this would make an HTTP POST to the webhook
      devLog('Sending Teams notification', teamsMessage);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return true
    } catch (error) {
      console.error('Failed to send Teams notification:', error)
      return false
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    switch (payload.type) {
      case 'slack':
        return this.sendSlackNotification(payload.event, payload.data, payload.channel)
      case 'teams':
        return this.sendTeamsNotification(payload.event, payload.data)
      default:
        console.warn(`Unknown notification type: ${payload.type}`)
        return false
    }
  }

  // Convenience methods for common notifications
  async notifyLateCheckIn(employeeData: {
    name: string
    checkInTime: string
    lateMinutes: number
    department?: string
  }) {
    const data = {
      employee_name: employeeData.name,
      check_in_time: employeeData.checkInTime,
      late_minutes: employeeData.lateMinutes,
      department: employeeData.department
    }

    // Send to both Slack and Teams if configured
    const results = await Promise.all([
      this.sendSlackNotification('attendance.late', data),
      this.sendTeamsNotification('attendance.late', data)
    ])

    return results.some(r => r)
  }

  async notifyLeaveRequest(leaveData: {
    employeeName: string
    startDate: string
    endDate: string
    leaveType: string
    reason?: string
    approvalLink: string
  }) {
    const data = {
      employee_name: leaveData.employeeName,
      start_date: leaveData.startDate,
      end_date: leaveData.endDate,
      leave_type: leaveData.leaveType,
      reason: leaveData.reason,
      approval_link: leaveData.approvalLink
    }

    const results = await Promise.all([
      this.sendSlackNotification('leave.request', data),
      this.sendTeamsNotification('leave.request', data)
    ])

    return results.some(r => r)
  }

  async notifyTaskOverdue(taskData: {
    title: string
    assigneeName: string
    dueDate: string
    priority: string
  }) {
    const data = {
      task_title: taskData.title,
      assignee_name: taskData.assigneeName,
      due_date: taskData.dueDate,
      priority: taskData.priority
    }

    const results = await Promise.all([
      this.sendSlackNotification('task.overdue', data),
      this.sendTeamsNotification('task.overdue', data)
    ])

    return results.some(r => r)
  }

  async notifyFormSubmission(formData: {
    formName: string
    submitterName: string
    submissionTime: string
    viewLink: string
  }) {
    const data = {
      form_name: formData.formName,
      submitter_name: formData.submitterName,
      submission_time: formData.submissionTime,
      view_link: formData.viewLink
    }

    const results = await Promise.all([
      this.sendSlackNotification('form.submitted', data),
      this.sendTeamsNotification('form.submitted', data)
    ])

    return results.some(r => r)
  }
}

export const notificationService = new NotificationService()