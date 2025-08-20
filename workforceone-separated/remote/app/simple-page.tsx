export default function SimpleRemoteTest() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem 0' 
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: '#2563eb',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>👥</div>
            <h1 style={{ 
              marginLeft: '12px', 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#111827',
              margin: '0 0 0 12px'
            }}>WorkforceOne Remote</h1>
          </div>
          <button style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>Get Started</button>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '3rem 1rem' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Remote Workforce Management
          </h2>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#6b7280',
            maxWidth: '768px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Manage distributed teams, assign tasks, track projects, and optimize routes - all from one platform.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
              Team Management
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              Organize teams, assign roles, and manage your distributed workforce effectively.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
              Task Assignment
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              Create, assign, and track tasks with real-time progress updates and notifications.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
              Route Planning
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              Optimize daily routes for field workers with GPS tracking and turn-by-turn navigation.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
              Multi-Location
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              Manage multiple office locations, outlets, and remote work sites seamlessly.
            </p>
          </div>
        </div>

        {/* Test Status */}
        <div style={{ 
          marginTop: '4rem',
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #10b981'
        }}>
          <h3 style={{ color: '#10b981', fontSize: '1.5rem', margin: '0 0 1rem 0' }}>
            ✅ Remote App Successfully Running!
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            This is your dedicated WorkforceOne Remote application - completely isolated from Time and Guard features.
          </p>
          <div style={{ marginTop: '1rem', fontSize: '14px', color: '#9ca3af' }}>
            Running on: <strong>localhost:3001</strong>
          </div>
        </div>
      </div>
    </div>
  );
}