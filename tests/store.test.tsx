import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreProvider, useStore } from '../src/store';
import { demoWorkspace } from '../src/demo';

function Controls() {
  const store = useStore();
  return (
    <div>
      <output aria-label="Workspace">{JSON.stringify(store.workspace)}</output>
      <output aria-label="Mode">{store.mode}</output>
      {store.warning && <p role="alert">Storage unavailable</p>}
      {store.recovered && <p role="status">Recovered saved data</p>}
      <button onClick={() => store.switchMode(store.mode === 'real' ? 'demo' : 'real')}>
        Toggle mode
      </button>
      <button
        onClick={() => {
          store.saveProfile({ course: 'Mathematics', documents: [] });
          store.saveApplication('first');
          store.saveApplication('second');
        }}
      >
        Save together
      </button>
      <button onClick={() => store.saveDocument('first', 'Marksheet', true)}>Check document</button>
      <button onClick={store.resetDemo}>Reset demo</button>
      <button onClick={store.clearReal}>Clear real</button>
    </div>
  );
}
const mount = () =>
  render(
    <StoreProvider>
      <Controls />
    </StoreProvider>,
  );
const workspace = () => JSON.parse(screen.getByLabelText('Workspace').textContent!);

describe('workspace persistence', () => {
  it('preserves multiple updates in the same event', async () => {
    mount();
    await userEvent.click(screen.getByText('Save together'));
    expect(workspace().profile.course).toBe('Mathematics');
    expect(workspace().applications.map((item: { id: string }) => item.id)).toEqual([
      'first',
      'second',
    ]);
  });
  it('isolates modes across changes, resets, clear, and remount', async () => {
    const view = mount();
    await userEvent.click(screen.getByText('Save together'));
    const real = workspace();
    await userEvent.click(screen.getByText('Toggle mode'));
    await userEvent.click(screen.getByText('Check document'));
    expect(workspace().profile.documents).toContain('Marksheet');
    view.unmount();
    mount();
    expect(screen.getByLabelText('Mode')).toHaveTextContent('demo');
    expect(workspace().profile.documents).toContain('Marksheet');
    await userEvent.click(screen.getByText('Reset demo'));
    expect(workspace().profile).toEqual(demoWorkspace().profile);
    await userEvent.click(screen.getByText('Toggle mode'));
    expect(workspace()).toEqual(real);
    await userEvent.click(screen.getByText('Clear real'));
    expect(workspace()).toEqual({ profile: null, applications: [] });
    await userEvent.click(screen.getByText('Toggle mode'));
    expect(workspace().applications).toHaveLength(6);
  });
  it('recovers malformed storage without overwriting it merely on load', () => {
    localStorage.setItem('grantly:real:v1', '{"profile":false}');
    mount();
    expect(screen.getByText('Recovered saved data')).toHaveAttribute('role', 'status');
    expect(workspace()).toEqual({ profile: null, applications: [] });
    expect(localStorage.getItem('grantly:real:v1')).toBe('{"profile":false}');
  });
  it('keeps session edits when storage rejects writes', async () => {
    const failure = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    mount();
    await userEvent.click(screen.getByText('Save together'));
    expect(workspace().applications).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Storage unavailable');
    failure.mockRestore();
  });
});
