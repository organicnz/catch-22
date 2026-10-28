import { describe, expect, it } from 'bun:test';
import { cleanNZPhone, classifyNZPhone, formatNZPhone } from '@/lib/nz-phone';

describe('cleanNZPhone()', () => {
  it('handles +64 prefix', () => {
    expect(cleanNZPhone('+64 21 123 4567')).toBe('0211234567');
    expect(cleanNZPhone('+64-9-480-1234')).toBe('094801234');
  });

  it('handles 64 prefix without plus', () => {
    expect(cleanNZPhone('64211234567')).toBe('0211234567');
  });

  it('strips dashes, spaces, and punctuation', () => {
    expect(cleanNZPhone('(09) 480-1234')).toBe('094801234');
    expect(cleanNZPhone('027.123.4567')).toBe('0271234567');
  });
});

describe('classifyNZPhone()', () => {
  it('identifies and formats NZ mobile numbers', () => {
    const mob = classifyNZPhone('0211234567');
    expect(mob.isValid).toBe(true);
    expect(mob.type).toBe('mobile');
    expect(mob.formatted).toBe('021 123 4567');
    expect(mob.carrier).toBe('One NZ / Spark Mobile');

    const twoDeg = classifyNZPhone('022 987 6543');
    expect(twoDeg.isValid).toBe(true);
    expect(twoDeg.type).toBe('mobile');
    expect(twoDeg.carrier).toBe('2degrees Mobile');
  });

  it('identifies and formats Auckland landlines', () => {
    const akl = classifyNZPhone('094801234');
    expect(akl.isValid).toBe(true);
    expect(akl.type).toBe('landline');
    expect(akl.formatted).toBe('09 480 1234');
    expect(akl.region).toBe('Auckland & Northland');
  });

  it('identifies and formats South Island landlines', () => {
    const chch = classifyNZPhone('033456789');
    expect(chch.isValid).toBe(true);
    expect(chch.type).toBe('landline');
    expect(chch.formatted).toBe('03 345 6789');
    expect(chch.region).toBe('South Island');
  });

  it('handles invalid phone numbers', () => {
    const short = classifyNZPhone('123');
    expect(short.isValid).toBe(false);
    expect(short.type).toBe('unknown');
  });
});

describe('formatNZPhone()', () => {
  it('formats unspaced input', () => {
    expect(formatNZPhone('0211234567')).toBe('021 123 4567');
    expect(formatNZPhone('091234567')).toBe('09 123 4567');
  });
});
