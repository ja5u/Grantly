import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ScholarshipNetwork } from '../src/ScholarshipNetwork';
import { Discover } from '../src/Discover';
import { Apply } from '../src/Applications';
import { ProfilePage } from '../src/ProfilePage';
import { StoreProvider } from '../src/store';
import { demoProfile, demoSchemes, demoWorkspace } from '../src/demo';
import { match } from '../src/domain';

function mount(children: React.ReactNode) {
  localStorage.setItem('grantly:mode', '"demo"');
  localStorage.setItem('grantly:demo:v1', JSON.stringify(demoWorkspace()));
  return render(
    <MemoryRouter>
      <StoreProvider>{children}</StoreProvider>
    </MemoryRouter>,
  );
}
it('opens a graph node by keyboard, adjusts zoom, and resets the viewport', async () => {
  const select = vi.fn();
  const { container } = render(
    <ScholarshipNetwork
      results={[{ scheme: demoSchemes[0], match: match(demoProfile, demoSchemes[0]) }]}
      select={select}
    />,
  );
  const node = screen.getByRole('button', { name: 'Horizon Engineering Grant, Eligible' });
  node.focus();
  await userEvent.keyboard('{Enter}');
  expect(select).toHaveBeenCalledWith('horizon');
  await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(screen.getByText('120%')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Reset network view' }));
  expect(screen.getByText('100%')).toBeVisible();
  // jsdom has no canvas/layout engine; color contrast is checked in a real browser.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(result.violations).toEqual([]);
});
it('keeps search and list results synchronized and opens an accessible detail dialog', async () => {
  mount(<Discover schemes={demoSchemes} />);
  await userEvent.type(screen.getByRole('textbox', { name: 'Search scholarships' }), 'Horizon');
  expect(screen.getByRole('heading', { name: /1 opportunity/ })).toBeVisible();
  const node = screen.getByRole('button', { name: 'Horizon Engineering Grant, Eligible' });
  node.focus();
  await userEvent.keyboard('{Enter}');
  const dialog = screen.getByRole('dialog', { name: 'Horizon Engineering Grant details' });
  expect(dialog).toBeVisible();
  fireEvent(dialog, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() => expect(node).toHaveFocus());
  await userEvent.click(screen.getByRole('button', { name: 'List' }));
  expect(screen.getByRole('button', { name: /Horizon Engineering Grant/ })).toBeVisible();
  expect(screen.queryByText('Orbit Merit Scholarship')).toBeNull();
});
it('checklist completion requires explicit submission to change application status', async () => {
  mount(<Apply scheme={demoSchemes[0]} />);
  await userEvent.click(screen.getByRole('checkbox', { name: /Marksheet/ }));
  await userEvent.click(screen.getByRole('checkbox', { name: /Admission letter/ }));
  expect(screen.getByText('100%')).toBeVisible();
  let stored = JSON.parse(localStorage.getItem('grantly:demo:v1')!);
  expect(stored.applications.find((item: { id: string }) => item.id === 'horizon').status).toBe(
    'In progress',
  );
  await userEvent.click(screen.getByRole('button', { name: 'I’ve submitted' }));
  stored = JSON.parse(localStorage.getItem('grantly:demo:v1')!);
  expect(stored.applications.find((item: { id: string }) => item.id === 'horizon').status).toBe(
    'Submitted',
  );
});
it('shows an accessible error for invalid profile values', async () => {
  mount(<ProfilePage onboarding />);
  const input = screen.getByRole('spinbutton', { name: /Last exam marks/ });
  await userEvent.clear(input);
  await userEvent.type(input, '105');
  await userEvent.click(screen.getByRole('button', { name: 'Review profile' }));
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toBeVisible();
});
