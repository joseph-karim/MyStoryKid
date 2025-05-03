import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as luluService from '../../src/services/luluService';

vi.mock('../../src/services/luluService', () => {
  return {
    getLuluToken: vi.fn().mockResolvedValue('mock-token'),
    validateInteriorFile: vi.fn().mockResolvedValue({ status: 'VALID' }),
    calculateCoverDimensions: vi.fn().mockResolvedValue({
      cover_width: 8.5,
      cover_height: 11,
      spine_width: 0.25
    }),
    validateCoverFile: vi.fn().mockResolvedValue({ status: 'VALID' }),
    calculateShippingCosts: vi.fn().mockResolvedValue([
      { level: 'MAIL', price: 3.99, currency: 'USD', estimated_days: 7 },
      { level: 'GROUND', price: 5.99, currency: 'USD', estimated_days: 5 }
    ]),
    createPrintJob: vi.fn().mockResolvedValue({
      id: 'mock-print-job-id',
      status: 'CREATED'
    }),
    getPrintJobStatus: vi.fn().mockResolvedValue('IN_PRODUCTION'),
    getPrintJobDetails: vi.fn().mockResolvedValue({
      id: 'mock-print-job-id',
      status: 'IN_PRODUCTION',
      line_items: [{ title: 'Test Book', quantity: 1 }]
    })
  };
});

describe('Lulu Direct API Integration', () => {
  const originalEnv = { ...import.meta.env };
  
  beforeEach(() => {
    import.meta.env = {
      ...import.meta.env,
      VITE_LULU_CLIENT_KEY: 'test-key',
      VITE_LULU_CLIENT_SECRET: 'test-secret',
      VITE_LULU_BASE64_AUTH: 'test-auth',
      VITE_LULU_CONTACT_EMAIL: 'test@example.com'
    };
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    import.meta.env = { ...originalEnv };
  });
  
  describe('Authentication', () => {
    it('should get a token successfully', async () => {
      const token = await luluService.getLuluToken();
      expect(token).toBe('mock-token');
      expect(luluService.getLuluToken).toHaveBeenCalled();
    });
  });
  
  describe('File Validation', () => {
    it('should validate interior PDF files', async () => {
      const result = await luluService.validateInteriorFile('test.pdf', 'test-package-id');
      expect(result).toHaveProperty('status', 'VALID');
    });
    
    it('should validate cover PDF files', async () => {
      const result = await luluService.validateCoverFile('test.pdf', 'test-package-id', 32);
      expect(result).toHaveProperty('status', 'VALID');
    });
    
    it('should calculate cover dimensions', async () => {
      const dimensions = await luluService.calculateCoverDimensions('test-package-id', 32);
      expect(dimensions).toHaveProperty('cover_width');
      expect(dimensions).toHaveProperty('cover_height');
      expect(dimensions).toHaveProperty('spine_width');
    });
  });
  
  describe('Shipping and Print Jobs', () => {
    it('should calculate shipping costs', async () => {
      const bookData = { pageCount: 32, podPackageId: 'test-package-id' };
      const shippingAddress = {
        city: 'Test City',
        country_code: 'US',
        postcode: '12345',
        state_code: 'CA'
      };
      
      const options = await luluService.calculateShippingCosts(bookData, shippingAddress);
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });
    
    it('should create a print job', async () => {
      const bookData = {
        id: 'test-id',
        title: 'Test Book',
        coverUrl: 'test-cover.pdf',
        interiorUrl: 'test-interior.pdf',
        podPackageId: 'test-package-id'
      };
      
      const shippingAddress = {
        name: 'Test User',
        street1: 'Test Street',
        city: 'Test City',
        country_code: 'US',
        postcode: '12345',
        state_code: 'CA'
      };
      
      const job = await luluService.createPrintJob(bookData, shippingAddress, 'MAIL');
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('status');
    });
    
    it('should get print job status', async () => {
      const status = await luluService.getPrintJobStatus('test-job-id');
      expect(status).toBe('IN_PRODUCTION');
    });
    
    it('should get print job details', async () => {
      const details = await luluService.getPrintJobDetails('test-job-id');
      expect(details).toHaveProperty('id');
      expect(details).toHaveProperty('status');
      expect(details).toHaveProperty('line_items');
    });
  });
  
  describe('Integration with Book Generation Flow', () => {
    it('should integrate with the book generation workflow', async () => {
      const bookData = {
        pageCount: 32,
        podPackageId: 'test-package-id'
      };
      
      const shippingAddress = {
        name: 'Test User',
        street1: 'Test Street',
        city: 'Test City',
        country_code: 'US',
        postcode: '12345',
        state_code: 'CA'
      };
      
      const shippingOptions = await luluService.calculateShippingCosts(bookData, shippingAddress);
      expect(shippingOptions.length).toBeGreaterThan(0);
      
      const printJobData = {
        id: 'test-id',
        title: 'Test Book',
        coverUrl: 'test-cover.pdf',
        interiorUrl: 'test-interior.pdf',
        podPackageId: 'test-package-id'
      };
      
      const printJob = await luluService.createPrintJob(printJobData, shippingAddress, 'MAIL');
      expect(printJob).toHaveProperty('id');
      
      expect(luluService.calculateShippingCosts).toHaveBeenCalled();
      expect(luluService.createPrintJob).toHaveBeenCalled();
    });
  });
});
