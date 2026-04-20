import React from 'react';

export default function Index() {
  return (
    <div style={{ 
      padding: '100px', 
      textAlign: 'center', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh' 
    }}>
      <h1 style={{ color: '#8B5CF6', fontSize: '3rem', marginBottom: '20px' }}>
        CREATOR IA PRO (MINIMAL)
      </h1>
      <p style={{ color: '#64748b' }}>
        Si ves esto, la carga de páginas dinámicas está funcionando correctamente.
      </p>
      <div style={{ marginTop: '50px' }}>
        <a href="/auth" style={{ color: '#8B5CF6', fontWeight: 'bold' }}>Ir al Login</a>
      </div>
    </div>
  );
}
