import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="page narrow" role="alert">
          <h1>This view couldn’t load</h1>
          <p className="lede">
            Reload the page to try again. Your saved profile and applications remain in this
            browser.
          </p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload Grantly
          </button>
        </section>
      );
    return this.props.children;
  }
}
