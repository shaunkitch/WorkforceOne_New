# Multi-Tenant System Implementation

## Overview
Implemented comprehensive multi-tenancy for WorkforceOne, allowing users to either create new organizations or join existing ones during the signup process. This enables multiple organizations to use the same system while maintaining complete data separation.

## Key Features

### 1. Dual Signup Modes
- **Join Organization**: Users can join existing organizations
- **Create Organization**: Users can create new organizations (becoming admin)
- **Toggle Interface**: Easy switching between modes with visual toggle buttons

### 2. Organization Discovery
- **Dynamic Loading**: Automatically loads available organizations
- **Smart Selection**: Auto-selects if only one organization exists
- **Empty State Handling**: Prompts to create organization if none exist

### 3. URL-Based Invitations
- **Parameterized URLs**: Support for organization-specific invitation links
- **Pre-filled Forms**: Email and name automatically populated from URL parameters
- **Direct Organization Assignment**: Users bypass organization selection when invited

### 4. Role-Based Access
- **Admin Assignment**: Organization creators become admins
- **Member Assignment**: Organization joiners become members
- **Flexible Permissions**: Foundation for role-based feature access

## Technical Implementation

### Signup Flow Enhancement

#### URL Parameters Support
```typescript
// Example invitation URL:
// /signup?org=123&email=john@example.com&name=John%20Doe

const orgParam = searchParams.get('org')
const emailParam = searchParams.get('email')  
const nameParam = searchParams.get('name')
```

#### Organization Selection
```typescript
interface Organization {
  id: string
  name: string
  slug: string
}

// Dynamic organization loading
const fetchOrganizations = async () => {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .order('name')
}
```

#### Multi-Mode Signup Logic
```typescript
const handleSignup = async (e: React.FormEvent) => {
  // Validation based on mode
  if (signupMode === 'join' && !selectedOrgId) {
    throw new Error('Please select an organization to join.')
  }
  
  if (signupMode === 'create' && !formData.organizationName) {
    throw new Error('Please enter an organization name.')
  }

  // Organization creation for new orgs
  if (signupMode === 'create') {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: formData.organizationName,
        slug: formData.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        settings: {}
      })
  }

  // Profile creation with proper role assignment
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      full_name: formData.fullName,
      organization_id: organizationId,
      role: signupMode === 'create' ? 'admin' : 'member'
    })
}
```

### Enhanced User Interface

#### Mode Toggle
```jsx
<div className="flex rounded-lg bg-gray-100 p-1">
  <Button
    variant={signupMode === 'join' ? 'default' : 'ghost'}
    onClick={() => setSignupMode('join')}
  >
    <Users className="h-4 w-4 mr-2" />
    Join Organization
  </Button>
  <Button
    variant={signupMode === 'create' ? 'default' : 'ghost'}
    onClick={() => setSignupMode('create')}
  >
    <Plus className="h-4 w-4 mr-2" />
    Create Organization
  </Button>
</div>
```

#### Dynamic Organization Selection
```jsx
{signupMode === 'join' ? (
  <Select value={selectedOrgId} onValueChange={setSelectedOrgId} required>
    <SelectTrigger>
      <SelectValue placeholder="Choose an organization" />
    </SelectTrigger>
    <SelectContent>
      {organizations.map((org) => (
        <SelectItem key={org.id} value={org.id}>
          {org.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
) : (
  <Input
    value={formData.organizationName}
    onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
    placeholder="Acme Corp"
    required
  />
)}
```

### Invitation System Enhancement

#### Personalized Signup URLs
```typescript
const signupUrl = `${window.location.origin}/signup?org=${organizationId}&email=${encodeURIComponent(registerForm.email)}&name=${encodeURIComponent(registerForm.fullName)}`

const inviteMessage = `To invite ${registerForm.fullName}:

1. Share this personalized signup link:
${signupUrl}

2. They will automatically join your organization
3. Their pre-filled details:
   - Name: ${registerForm.fullName}
   - Department: ${registerForm.department}
   - Role: ${registerForm.role}`
```

## Data Architecture

### Organization Isolation
- **Strict Boundaries**: All data queries filtered by organization_id
- **Automatic Assignment**: New users inherit organization context
- **Secure Access**: Users can only see data from their organization

### Role Structure
```sql
-- Profile roles
role VARCHAR(50) DEFAULT 'member' 
-- Possible values: 'admin', 'manager', 'lead', 'member'

-- Organization relationship
organization_id UUID NOT NULL REFERENCES organizations(id)
```

### Database Schema Updates
```sql
-- Enhanced organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role VARCHAR(50) DEFAULT 'member',
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security & Access Control

### Organization Boundary Enforcement
- **Query Filtering**: All database queries include organization_id filter
- **URL Parameter Validation**: Organization IDs validated against user access
- **Role-Based Features**: Admin-only features protected by role checks

### Invitation Security
- **Organization Context**: Invitations include organization validation
- **URL Expiration**: Consider implementing time-limited invitation URLs
- **Email Verification**: Supabase handles email verification automatically

## User Experience Features

### Smart Defaults
- **Auto-Selection**: Single organization auto-selected
- **Pre-filled Forms**: URL parameters populate form fields
- **Mode Detection**: URL parameters determine appropriate signup mode

### Progressive Disclosure
- **Context-Aware UI**: Different interfaces for join vs create modes
- **Loading States**: Smooth loading experience for organization discovery
- **Empty States**: Helpful guidance when no organizations exist

### Error Handling
- **Validation Messages**: Clear error messages for each scenario
- **Conflict Resolution**: Duplicate organization name handling
- **Network Resilience**: Graceful handling of API failures

## Integration Points

### Teams Page Enhancement
- **Organization-Aware Invitations**: Invitation URLs include organization context
- **Personalized Links**: Generated URLs auto-fill organization selection
- **Team Assignment**: Post-signup team assignment instructions

### Dashboard Context
- **Organization-Scoped Data**: All dashboard statistics filtered by organization
- **Multi-Org Support**: Foundation for users with multiple org access (future)

## Files Modified

### Core Signup System
- `/app/signup/page.tsx`: Complete multi-tenant signup implementation
  - Dual mode toggle (join/create)
  - Organization discovery and selection
  - URL parameter handling for invitations
  - Enhanced form with additional fields
  - Smart validation and error handling

### Invitation System
- `/app/dashboard/teams/page.tsx`: Enhanced invitation URL generation
  - Organization-specific signup URLs
  - Pre-filled form parameter encoding
  - Multi-tenant invitation instructions

## Usage Scenarios

### 1. New Organization Creation
1. User visits `/signup`
2. Clicks "Create Organization" 
3. Enters organization name and personal details
4. Becomes admin of new organization
5. Can invite others to join their organization

### 2. Joining Existing Organization
1. User visits `/signup` or invitation URL
2. Selects organization from dropdown (or auto-selected via URL)
3. Enters personal details
4. Becomes member of selected organization
5. Team leads can add them to specific teams

### 3. Invitation Flow
1. Team lead uses "Register User" feature
2. System generates personalized signup URL
3. Invited user clicks URL
4. Form pre-filled with organization, email, name
5. User completes signup and joins organization

## Benefits

### For Organizations
- **Data Isolation**: Complete separation between organizations
- **Flexible Growth**: Support unlimited organizations and users
- **Easy Onboarding**: Streamlined invitation process

### For Users
- **Simple Signup**: Clear path to join or create organizations
- **Pre-filled Forms**: Reduced friction for invited users
- **Role Clarity**: Automatic role assignment based on signup mode

### for Administrators
- **Scalable Architecture**: Supports growth from single to multi-organization
- **Security**: Built-in data boundaries and access control
- **Maintainability**: Clean separation of concerns

## Future Enhancements

### Advanced Multi-Tenancy
- **Cross-Organization Access**: Users with multiple organization memberships
- **Organization Switching**: UI to switch between organizations
- **Organization Settings**: Admin panels for organization configuration

### Enhanced Invitations
- **Time-Limited URLs**: Expiring invitation links
- **Bulk Invitations**: CSV upload for multiple users
- **Email Integration**: Automated invitation email delivery

### Enterprise Features
- **SSO Integration**: Single Sign-On for enterprise organizations
- **Custom Branding**: Organization-specific themes and branding
- **API Access**: Organization-scoped API keys and access