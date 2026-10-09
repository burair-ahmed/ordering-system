'use client';

import { useEffect } from 'react';
import { captureOrderSource } from '../lib/orderSource';

/**
 * Invisible tracking component that captures UTM parameters and referrer
 * as soon as a customer lands on any page of Little Karachi Express.
 */
export default function OrderSourceCapture() {
  useEffect(() => {
    captureOrderSource();
  }, []);

  return null;
}
