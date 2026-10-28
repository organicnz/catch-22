import { describe, expect, it } from 'bun:test';
import { formatNZGstNumber, validateNZGstNumber, verifyNZIRDChecksum } from '@/lib/nz-gst';

describe('verifyNZIRDChecksum()', () => {
  it('validates official Inland Revenue 8-digit example (49091850)', () => {
    expect(verifyNZIRDChecksum('49091850')).toBe(true);
  });

  it('rejects invalid checksums', () => {
    expect(verifyNZIRDChecksum('49091851')).toBe(false);
    expect(verifyNZIRDChecksum('12345678')).toBe(false);
    expect(verifyNZIRDChecksum('00000000')).toBe(false);
  });

  it('rejects numbers that are too short or too long', () => {
    expect(verifyNZIRDChecksum('1234567')).toBe(false);
    expect(verifyNZIRDChecksum('1234567890')).toBe(false);
  });
});

describe('formatNZGstNumber()', () => {
  it('formats 8-digit numbers as XX-XXX-XXX', () => {
    expect(formatNZGstNumber('49091850')).toBe('49-091-850');
  });

  it('formats 9-digit numbers as XXX-XXX-XXX', () => {
    expect(formatNZGstNumber('133842108')).toBe('133-842-108');
  });

  it('formats partial input cleanly', () => {
    expect(formatNZGstNumber('12')).toBe('12');
    expect(formatNZGstNumber('12345')).toBe('12-345');
  });
});

describe('validateNZGstNumber()', () => {
  it('returns valid status for compliant IRD number', () => {
    const res = validateNZGstNumber('49-091-850');
    expect(res.isValid).toBe(true);
    expect(res.isChecksumValid).toBe(true);
    expect(res.formatted).toBe('49-091-850');
    expect(res.error).toBeUndefined();
  });

  it('flags incorrect length', () => {
    const short = validateNZGstNumber('123');
    expect(short.isValid).toBe(false);
    expect(short.error).toContain('8 or 9 digits');
  });
});
