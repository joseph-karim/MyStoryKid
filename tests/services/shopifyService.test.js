import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as shopifyService from '../../src/services/shopifyService';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
vi.mock('../../src/services/pdfService', () => ({
  generateDigitalPDF: vi.fn(),
  generatePrintInteriorPDF: vi.fn(),
  generatePrintCoverPDF: vi.fn()
}));

vi.mock('../../src/services/luluService', () => ({
  calculateCoverDimensions: vi.fn(),
  createPrintJob: vi.fn()
}));

vi.mock('../../src/services/supabaseClient', () => ({
  uploadFileToSupabase: vi.fn()
}));

describe('Shopify Service', () => {
  const mockBook = {
    id: 'test-book-123',
    title: 'Test Adventure',
    childName: 'Alex',
    coverImageUrl: 'https://example.com/cover.jpg',
    pages: [
      { id: 1, type: 'content', imageUrl: 'https://example.com/page1.jpg', text: 'Page 1' },
      { id: 2, type: 'content', imageUrl: 'https://example.com/page2.jpg', text: 'Page 2' },
      { id: 3, type: 'content', imageUrl: 'https://example.com/page3.jpg', text: 'Page 3' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock environment variables
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com');
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN', 'test-storefront-token');
    vi.stubEnv('VITE_SHOPIFY_ADMIN_ACCESS_TOKEN', 'test-admin-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('validateShopifyConfig', () => {
    it('should return configuration status', () => {
      const config = shopifyService.validateShopifyConfig();
      
      expect(config).toEqual({
        storeDomain: true,
        storefrontToken: true,
        adminToken: true,
        isConfigured: true,
        isFullyConfigured: true
      });
    });

    it('should handle missing configuration', () => {
      vi.unstubAllEnvs();
      
      const config = shopifyService.validateShopifyConfig();
      
      expect(config).toEqual({
        storeDomain: false,
        storefrontToken: false,
        adminToken: false,
        isConfigured: false,
        isFullyConfigured: false
      });
    });
  });

  describe('createOrUpdateShopifyProduct', () => {
    it('should create a new product when none exists', async () => {
      // Mock API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ products: [] }) // No existing product
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            product: {
              id: 'new-product-123',
              title: 'Test Adventure - Personalized Story for Alex',
              variants: [
                { id: 'var-1', title: 'Digital Download', sku: 'digital', price: '10.00' },
                { id: 'var-2', title: 'Printed Book - Standard Shipping', sku: 'print-standard', price: '24.99' },
                { id: 'var-3', title: 'Printed Book - Expedited Shipping', sku: 'print-expedited', price: '34.98' }
              ]
            }
          })
        });

      const product = await shopifyService.createOrUpdateShopifyProduct(mockBook);

      expect(product.id).toBe('new-product-123');
      expect(product.title).toBe('Test Adventure - Personalized Story for Alex');
      expect(product.variants).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should update existing product', async () => {
      // Mock API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            products: [{
              id: 'existing-product-123',
              title: 'Old Title'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            product: {
              id: 'existing-product-123',
              title: 'Test Adventure - Personalized Story for Alex',
              variants: [
                { id: 'var-1', title: 'Digital Download', sku: 'digital', price: '10.00' },
                { id: 'var-2', title: 'Printed Book - Standard Shipping', sku: 'print-standard', price: '24.99' },
                { id: 'var-3', title: 'Printed Book - Expedited Shipping', sku: 'print-expedited', price: '34.98' }
              ]
            }
          })
        });

      const product = await shopifyService.createOrUpdateShopifyProduct(mockBook);

      expect(product.id).toBe('existing-product-123');
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Verify update call was made
      const updateCall = fetch.mock.calls[1];
      expect(updateCall[0]).toContain('/products/existing-product-123.json');
      expect(updateCall[1].method).toBe('PUT');
    });

    it('should include enhanced variants when enhancement cost is provided', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ products: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            product: {
              id: 'new-product-123',
              variants: [
                { id: 'var-1', sku: 'digital' },
                { id: 'var-2', sku: 'print-standard' },
                { id: 'var-3', sku: 'print-expedited' },
                { id: 'var-4', sku: 'print-standard-enhanced' },
                { id: 'var-5', sku: 'print-expedited-enhanced' }
              ]
            }
          })
        });

      const product = await shopifyService.createOrUpdateShopifyProduct(mockBook, {
        enhancementCost: 2.50
      });

      expect(product.variants).toHaveLength(5);
      expect(product.variants.some(v => v.sku === 'print-standard-enhanced')).toBe(true);
      expect(product.variants.some(v => v.sku === 'print-expedited-enhanced')).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(shopifyService.createOrUpdateShopifyProduct(mockBook))
        .rejects.toThrow('Network error');
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      // Mock product creation
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ products: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            product: {
              id: 'product-123',
              variants: [
                { id: 'gid://shopify/ProductVariant/123', sku: 'digital', price: '10.00' }
              ]
            }
          })
        })
        // Mock checkout creation
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutCreate: {
                checkout: {
                  id: 'gid://shopify/Checkout/abc123',
                  webUrl: 'https://test-store.myshopify.com/checkout/abc123',
                  totalPriceV2: {
                    amount: '10.00',
                    currencyCode: 'USD'
                  },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          id: 'line-item-1',
                          title: 'Digital Download',
                          quantity: 1,
                          variant: {
                            id: 'gid://shopify/ProductVariant/123',
                            title: 'Digital Download',
                            priceV2: { amount: '10.00', currencyCode: 'USD' }
                          }
                        }
                      }
                    ]
                  }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

      const checkoutSession = await shopifyService.createCheckoutSession(mockBook, 'digital');

      expect(checkoutSession.checkoutId).toBe('gid://shopify/Checkout/abc123');
      expect(checkoutSession.checkoutUrl).toBe('https://test-store.myshopify.com/checkout/abc123');
      expect(checkoutSession.totalPrice).toBe('10.00');
      expect(checkoutSession.currency).toBe('USD');
      expect(checkoutSession.lineItems).toHaveLength(1);
    });

    it('should handle checkout creation errors', async () => {
      // Mock product creation success
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ products: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            product: {
              id: 'product-123',
              variants: [{ id: 'var-123', sku: 'digital' }]
            }
          })
        })
        // Mock checkout creation failure
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutCreate: {
                checkout: null,
                checkoutUserErrors: [
                  { field: 'lineItems', message: 'Invalid variant' }
                ]
              }
            }
          })
        });

      await expect(shopifyService.createCheckoutSession(mockBook, 'digital'))
        .rejects.toThrow('Checkout creation failed');
    });

    it('should include enhancement metadata when provided', async () => {
      // Mock successful responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ products: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            product: {
              id: 'product-123',
              variants: [{ id: 'var-123', sku: 'print-standard-enhanced' }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutCreate: {
                checkout: {
                  id: 'checkout-123',
                  webUrl: 'https://example.com/checkout',
                  totalPriceV2: { amount: '27.49', currencyCode: 'USD' },
                  lineItems: { edges: [] }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

      await shopifyService.createCheckoutSession(mockBook, 'print-standard-enhanced', {
        printEnhancement: true,
        enhancementCost: 2.50
      });

      // Verify the GraphQL mutation included enhancement metadata
      const checkoutCall = fetch.mock.calls[2];
      const requestBody = JSON.parse(checkoutCall[1].body);
      expect(requestBody.variables.input.customAttributes).toEqual([
        { key: 'enhancement_cost', value: '2.5' },
        { key: 'enhancement_enabled', value: 'true' }
      ]);
    });
  });

  describe('cart management functions', () => {
    const mockCheckoutId = 'gid://shopify/Checkout/abc123';

    describe('getCart', () => {
      it('should retrieve cart information', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              node: {
                id: mockCheckoutId,
                webUrl: 'https://example.com/checkout',
                totalPriceV2: { amount: '10.00', currencyCode: 'USD' },
                subtotalPriceV2: { amount: '10.00', currencyCode: 'USD' },
                totalTaxV2: { amount: '0.00', currencyCode: 'USD' },
                lineItems: { edges: [] },
                discountApplications: { edges: [] }
              }
            }
          })
        });

        const cart = await shopifyService.getCart(mockCheckoutId);

        expect(cart.id).toBe(mockCheckoutId);
        expect(cart.totalPrice.amount).toBe('10.00');
        expect(cart.lineItems).toEqual([]);
        expect(cart.discountApplications).toEqual([]);
      });

      it('should handle checkout not found', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { node: null } })
        });

        await expect(shopifyService.getCart(mockCheckoutId))
          .rejects.toThrow('Checkout not found');
      });
    });

    describe('addToCart', () => {
      it('should add items to cart successfully', async () => {
        const mockLineItems = [
          { variantId: 'var-123', quantity: 1 }
        ];

        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutLineItemsAdd: {
                checkout: {
                  id: mockCheckoutId,
                  webUrl: 'https://example.com/checkout',
                  totalPriceV2: { amount: '20.00', currencyCode: 'USD' },
                  lineItems: { edges: [{ node: { id: 'line-1', quantity: 1 } }] }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

        const result = await shopifyService.addToCart(mockCheckoutId, mockLineItems);

        expect(result.id).toBe(mockCheckoutId);
        expect(result.totalPriceV2.amount).toBe('20.00');
      });

      it('should handle add to cart errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutLineItemsAdd: {
                checkout: null,
                checkoutUserErrors: [
                  { field: 'quantity', message: 'Invalid quantity' }
                ]
              }
            }
          })
        });

        await expect(shopifyService.addToCart(mockCheckoutId, []))
          .rejects.toThrow('Add to cart failed');
      });
    });

    describe('updateCartItems', () => {
      it('should update cart item quantities', async () => {
        const mockLineItems = [
          { id: 'line-1', quantity: 2 }
        ];

        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutLineItemsUpdate: {
                checkout: {
                  id: mockCheckoutId,
                  webUrl: 'https://example.com/checkout',
                  totalPriceV2: { amount: '20.00', currencyCode: 'USD' },
                  lineItems: { edges: [{ node: { id: 'line-1', quantity: 2 } }] }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

        const result = await shopifyService.updateCartItems(mockCheckoutId, mockLineItems);

        expect(result.id).toBe(mockCheckoutId);
        expect(result.totalPriceV2.amount).toBe('20.00');
      });
    });

    describe('removeFromCart', () => {
      it('should remove items from cart', async () => {
        const mockLineItemIds = ['line-1'];

        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutLineItemsRemove: {
                checkout: {
                  id: mockCheckoutId,
                  webUrl: 'https://example.com/checkout',
                  totalPriceV2: { amount: '0.00', currencyCode: 'USD' },
                  lineItems: { edges: [] }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

        const result = await shopifyService.removeFromCart(mockCheckoutId, mockLineItemIds);

        expect(result.id).toBe(mockCheckoutId);
        expect(result.totalPriceV2.amount).toBe('0.00');
        expect(result.lineItems.edges).toHaveLength(0);
      });
    });
  });

  describe('discount code management', () => {
    const mockCheckoutId = 'gid://shopify/Checkout/abc123';

    describe('applyDiscountCode', () => {
      it('should apply discount code successfully', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutDiscountCodeApplyV2: {
                checkout: {
                  id: mockCheckoutId,
                  webUrl: 'https://example.com/checkout',
                  totalPriceV2: { amount: '8.00', currencyCode: 'USD' },
                  subtotalPriceV2: { amount: '10.00', currencyCode: 'USD' },
                  discountApplications: {
                    edges: [{
                      node: {
                        code: 'SAVE20',
                        applicable: true,
                        value: { percentage: 20 }
                      }
                    }]
                  }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

        const result = await shopifyService.applyDiscountCode(mockCheckoutId, 'SAVE20');

        expect(result.id).toBe(mockCheckoutId);
        expect(result.totalPriceV2.amount).toBe('8.00');
        expect(result.discountApplications.edges).toHaveLength(1);
        expect(result.discountApplications.edges[0].node.code).toBe('SAVE20');
      });

      it('should handle invalid discount codes', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutDiscountCodeApplyV2: {
                checkout: null,
                checkoutUserErrors: [
                  { field: 'discountCode', message: 'Invalid discount code' }
                ]
              }
            }
          })
        });

        await expect(shopifyService.applyDiscountCode(mockCheckoutId, 'INVALID'))
          .rejects.toThrow('Discount code application failed');
      });
    });

    describe('removeDiscountCode', () => {
      it('should remove discount code successfully', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              checkoutDiscountCodeRemove: {
                checkout: {
                  id: mockCheckoutId,
                  webUrl: 'https://example.com/checkout',
                  totalPriceV2: { amount: '10.00', currencyCode: 'USD' },
                  subtotalPriceV2: { amount: '10.00', currencyCode: 'USD' },
                  discountApplications: { edges: [] }
                },
                checkoutUserErrors: []
              }
            }
          })
        });

        const result = await shopifyService.removeDiscountCode(mockCheckoutId);

        expect(result.id).toBe(mockCheckoutId);
        expect(result.totalPriceV2.amount).toBe('10.00');
        expect(result.discountApplications.edges).toHaveLength(0);
      });
    });
  });

  describe('webhook handling', () => {
    it('should handle order creation webhook', async () => {
      const mockWebhook = {
        topic: 'orders/create',
        data: {
          id: 'order-123',
          variants: [{ title: 'Digital Download' }],
          book: mockBook
        }
      };

      // Mock dependencies
      const { generateDigitalPDF } = await import('../../src/services/pdfService');
      const { uploadFileToSupabase } = await import('../../src/services/supabaseClient');
      
      generateDigitalPDF.mockResolvedValue(new ArrayBuffer(1024));
      uploadFileToSupabase.mockResolvedValue('https://example.com/download.pdf');

      const result = await shopifyService.handleShopifyWebhook(mockWebhook);

      expect(result.orderId).toBe('order-123');
      expect(result.type).toBe('digital');
      expect(result.downloadUrl).toBe('https://example.com/download.pdf');
    });

    it('should handle order cancellation webhook', async () => {
      const mockWebhook = {
        topic: 'orders/cancelled',
        data: { id: 'order-123' }
      };

      const result = await shopifyService.handleShopifyWebhook(mockWebhook);

      expect(result.status).toBe('cancelled');
      expect(result.orderId).toBe('order-123');
    });

    it('should handle unknown webhook topics', async () => {
      const mockWebhook = {
        topic: 'unknown/topic',
        data: {}
      };

      const result = await shopifyService.handleShopifyWebhook(mockWebhook);

      expect(result.status).toBe('ignored');
      expect(result.topic).toBe('unknown/topic');
    });
  });

  describe('error handling', () => {
    it('should handle missing configuration', async () => {
      vi.unstubAllEnvs();

      await expect(shopifyService.createCheckoutSession(mockBook, 'digital'))
        .rejects.toThrow('Shopify configuration missing');
    });

    it('should handle API errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(shopifyService.createOrUpdateShopifyProduct(mockBook))
        .rejects.toThrow('Network error');
    });

    it('should handle GraphQL errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: null,
          errors: [{ message: 'GraphQL error' }]
        })
      });

      await expect(shopifyService.createCheckoutSession(mockBook, 'digital'))
        .rejects.toThrow('Shopify GraphQL errors');
    });
  });
}); 