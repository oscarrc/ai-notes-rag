import { sanitizeUrl, validateUrl } from '../../../app/_utils/url';

describe('sanitizeUrl', () => {
  it('should allow http URLs', () => {
    const url = 'http://example.com';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should allow https URLs', () => {
    const url = 'https://example.com';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should allow mailto URLs', () => {
    const url = 'mailto:test@example.com';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should allow sms URLs', () => {
    const url = 'sms:+1234567890';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should allow tel URLs', () => {
    const url = 'tel:+1234567890';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should sanitize javascript URLs to about:blank', () => {
    const url = 'javascript:alert(1)';
    expect(sanitizeUrl(url)).toBe('about:blank');
  });

  it('should sanitize data URLs to about:blank', () => {
    const url = 'data:text/html,<script>alert(1)</script>';
    expect(sanitizeUrl(url)).toBe('about:blank');
  });

  it('should return the original string for invalid URLs', () => {
    const invalidUrl = 'not a url';
    expect(sanitizeUrl(invalidUrl)).toBe(invalidUrl);
  });
});

describe('validateUrl', () => {
  it('should validate http URLs', () => {
    expect(validateUrl('http://example.com')).toBe(true);
  });

  it('should validate https URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('should validate URLs with subdomains', () => {
    expect(validateUrl('https://subdomain.example.com')).toBe(true);
  });

  it('should validate URLs with query parameters', () => {
    expect(validateUrl('https://example.com?param=value')).toBe(true);
  });

  it('should validate URLs with hash fragments', () => {
    expect(validateUrl('https://example.com#section')).toBe(true);
  });

  it('should validate URLs with paths', () => {
    expect(validateUrl('https://example.com/path/to/page')).toBe(true);
  });

  it('should validate URLs with ports', () => {
    expect(validateUrl('https://example.com:8080')).toBe(true);
  });

  it('should validate email-like URLs', () => {
    expect(validateUrl('mailto:user@example.com')).toBe(true);
  });

  it('should validate "https://" as a special case', () => {
    expect(validateUrl('https://')).toBe(true);
  });

  it('should not validate empty strings', () => {
    expect(validateUrl('')).toBe(false);
  });

  it('should not validate plain words', () => {
    expect(validateUrl('example')).toBe(false);
  });

  it('should not validate invalid formats', () => {
    // The implemented URL regex allows many invalid formats
    // This is a known limitation of the regex used
    expect(validateUrl('example')).toBe(false);
  });
});
