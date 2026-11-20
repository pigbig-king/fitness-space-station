function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        textAlign: 'center',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '1rem',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '2rem' }}>健身空间站 Fitness Space Station</h1>
      <p style={{ margin: 0, color: '#555' }}>
        训练记录 · 计划自适应 · 科研证据 · 动作检查
      </p>
    </main>
  )
}

export default App
