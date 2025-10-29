import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) this.props.onError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 720, margin: '10vh auto', textAlign: 'center' }}>
          <h2>Ups! Nešto je pošlo po zlu.</h2>
          <p>Pokušajte osvježiti stranicu ili se vratiti kasnije.</p>
          <button onClick={this.handleReload} style={{ padding: '10px 16px' }}>Osvježi</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
