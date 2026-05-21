import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '../../src/lib/analytics';

function installWindowMock() {
  const dispatchEvent = vi.fn();
  vi.stubGlobal('window', { dispatchEvent });
  vi.stubGlobal('CustomEvent', class CustomEvent<T = unknown> {
    type: string;
    detail: T;

    constructor(type: string, init?: { detail?: T }) {
      this.type = type;
      this.detail = init?.detail as T;
    }
  });
  return { dispatchEvent };
}

describe('trackEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('strips sensitive metadata keys before dispatch', async () => {
    const { dispatchEvent } = installWindowMock();

    await trackEvent('story_create_started', {
      mode: 'local_demo',
      prompt: 'sensitive prompt',
      childFullName: 'Private Child'
    });

    expect(dispatchEvent).toHaveBeenCalledOnce();
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.detail.metadata).toEqual({ mode: 'local_demo' });
  });

  it('bounds metadata strings and key count', async () => {
    const { dispatchEvent } = installWindowMock();
    const metadata = Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [`key${index}`, 'x'.repeat(300)])
    );

    await trackEvent('story_export_created', metadata);

    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(Object.keys(event.detail.metadata)).toHaveLength(20);
    expect(event.detail.metadata.key0).toHaveLength(160);
  });

  it('does not throw when browser dispatch fails', async () => {
    const dispatchEvent = vi.fn(() => {
      throw new Error('dispatch blocked');
    });
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal('CustomEvent', class CustomEvent<T = unknown> {
      type: string;
      detail: T;

      constructor(type: string, init?: { detail?: T }) {
        this.type = type;
        this.detail = init?.detail as T;
      }
    });

    await expect(trackEvent('story_create_completed', { mode: 'local_demo' })).resolves.toBeUndefined();
  });
});
