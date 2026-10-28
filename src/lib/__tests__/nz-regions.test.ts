import { describe, expect, it } from 'bun:test';
import { getNZDeliveryEstimate, inferNZRegion } from '@/lib/nz-regions';

describe('inferNZRegion()', () => {
  it('correctly maps Auckland postcodes', () => {
    expect(inferNZRegion('0620')).toBe('Auckland'); // Takapuna / North Shore
    expect(inferNZRegion('1010')).toBe('Auckland'); // Auckland Central
    expect(inferNZRegion('2010')).toBe('Auckland'); // Pakuranga
  });

  it('correctly maps North Island postcodes', () => {
    expect(inferNZRegion('0110')).toBe('Northland'); // Whangārei
    expect(inferNZRegion('3110')).toBe('Bay of Plenty'); // Mount Maunganui
    expect(inferNZRegion('3216')).toBe('Waikato'); // Hamilton
    expect(inferNZRegion('4010')).toBe('Gisborne');
    expect(inferNZRegion('4110')).toBe("Hawke's Bay"); // Napier
    expect(inferNZRegion('4310')).toBe('Taranaki'); // New Plymouth
    expect(inferNZRegion('4410')).toBe('Manawatū-Whanganui'); // Palmerston North
    expect(inferNZRegion('6011')).toBe('Wellington'); // Wellington Central
  });

  it('correctly maps South Island postcodes', () => {
    expect(inferNZRegion('7010')).toBe('Nelson');
    expect(inferNZRegion('7201')).toBe('Marlborough'); // Blenheim
    expect(inferNZRegion('7825')).toBe('West Coast'); // Westport
    expect(inferNZRegion('8011')).toBe('Canterbury'); // Christchurch Central
    expect(inferNZRegion('9016')).toBe('Otago'); // Dunedin
    expect(inferNZRegion('9300')).toBe('Otago'); // Queenstown
    expect(inferNZRegion('9810')).toBe('Southland'); // Invercargill
  });

  it('handles invalid or non-4-digit postcodes gracefully', () => {
    expect(inferNZRegion('')).toBeNull();
    expect(inferNZRegion('12')).toBeNull();
    expect(inferNZRegion('12345')).toBeNull();
    expect(inferNZRegion('ABCD')).toBeNull();
  });
});

describe('getNZDeliveryEstimate()', () => {
  it('calculates Auckland delivery estimate', () => {
    const est = getNZDeliveryEstimate('1010', false);
    expect(est).not.toBeNull();
    if (est) {
      expect(est.region).toBe('Auckland');
      expect(est.island).toBe('North Island');
      expect(est.transitDays).toBe('1–2 business days');
    }
  });

  it('calculates rural Auckland delivery estimate', () => {
    const est = getNZDeliveryEstimate('0992', true);
    expect(est).not.toBeNull();
    if (est) {
      expect(est.region).toBe('Auckland');
      expect(est.transitDays).toBe('2–3 business days');
    }
  });

  it('calculates South Island delivery estimate', () => {
    const est = getNZDeliveryEstimate('8011', false);
    expect(est).not.toBeNull();
    if (est) {
      expect(est.region).toBe('Canterbury');
      expect(est.island).toBe('South Island');
      expect(est.transitDays).toBe('2–4 business days');
    }
  });

  it('calculates rural South Island delivery estimate', () => {
    const est = getNZDeliveryEstimate('9810', true);
    expect(est).not.toBeNull();
    if (est) {
      expect(est.region).toBe('Southland');
      expect(est.island).toBe('South Island');
      expect(est.transitDays).toBe('4–5 business days');
    }
  });
});
