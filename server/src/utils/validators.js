const ApiError = require('./ApiError');

/**
 * Comprehensive validation utilities for secure input handling
 */

/**
 * Validate numeric amount (no negative, not NaN, proper range)
 */
const validateAmount = (amount, fieldName = 'Amount', minValue = 0, maxValue = Number.MAX_SAFE_INTEGER) => {
  if (amount === undefined || amount === null) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    throw new ApiError(400, `${fieldName} must be a valid number`);
  }

  if (numAmount < minValue) {
    throw new ApiError(400, `${fieldName} cannot be less than ${minValue}`);
  }

  if (numAmount > maxValue) {
    throw new ApiError(400, `${fieldName} exceeds maximum allowed value`);
  }

  return numAmount;
};

/**
 * Validate quantity (positive integer)
 */
const validateQuantity = (quantity, fieldName = 'Quantity') => {
  if (quantity === undefined || quantity === null) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const numQty = Number(quantity);

  if (!Number.isInteger(numQty) || numQty <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }

  return numQty;
};

/**
 * Validate percentage (0-100)
 */
const validatePercentage = (percentage, fieldName = 'Percentage') => {
  if (percentage === undefined || percentage === null) {
    return 0;
  }

  const numPercent = Number(percentage);

  if (isNaN(numPercent)) {
    throw new ApiError(400, `${fieldName} must be a valid number`);
  }

  if (numPercent < 0 || numPercent > 100) {
    throw new ApiError(400, `${fieldName} must be between 0 and 100`);
  }

  return numPercent;
};

/**
 * Validate order items
 */
const validateOrderItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Order must contain at least one item');
  }

  return items.map((item, index) => {
    if (!item.product) {
      throw new ApiError(400, `Item ${index + 1}: Product is required`);
    }

    const quantity = validateQuantity(item.quantity, `Item ${index + 1} Quantity`);
    const unitPrice = validateAmount(item.unitPrice, `Item ${index + 1} Unit Price`, 0.01);

    return {
      ...item,
      quantity,
      unitPrice,
    };
  });
};

/**
 * Validate payment amount
 */
const validatePayment = (paidAmount, expectedAmount, fieldName = 'Payment') => {
  const amount = validateAmount(paidAmount, fieldName, 0.01, expectedAmount);

  if (amount > expectedAmount) {
    throw new ApiError(400, `${fieldName} cannot exceed invoice amount of ${expectedAmount}`);
  }

  return amount;
};

/**
 * Validate discount
 */
const validateDiscount = (discountType, discountValue, subtotal) => {
  if (discountType && !['none', 'percentage', 'fixed'].includes(discountType)) {
    throw new ApiError(400, 'Invalid discount type');
  }

  if (discountValue && discountValue < 0) {
    throw new ApiError(400, 'Discount cannot be negative');
  }

  if (discountType === 'percentage') {
    const percent = validatePercentage(discountValue, 'Discount Percentage');
    return {
      type: discountType,
      value: percent,
      amount: Math.round((subtotal * percent / 100) * 100) / 100,
    };
  }

  if (discountType === 'fixed') {
    const amount = validateAmount(discountValue || 0, 'Discount Amount', 0, subtotal);
    return {
      type: discountType,
      value: amount,
      amount: amount,
    };
  }

  return {
    type: 'none',
    value: 0,
    amount: 0,
  };
};

/**
 * Validate tax rate
 */
const validateTaxRate = (taxRate) => {
  if (!taxRate && taxRate !== 0) {
    return 0;
  }

  return validatePercentage(taxRate, 'Tax Rate');
};

/**
 * Validate string input (no injection attempts)
 */
const validateString = (str, fieldName = 'Field', minLength = 1, maxLength = 500) => {
  if (!str || typeof str !== 'string') {
    throw new ApiError(400, `${fieldName} must be a non-empty string`);
  }

  const trimmed = str.trim();

  if (trimmed.length < minLength) {
    throw new ApiError(400, `${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${fieldName} cannot exceed ${maxLength} characters`);
  }

  return trimmed;
};

/**
 * Validate email
 */
const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;

  if (!email || typeof email !== 'string') {
    throw new ApiError(400, 'Email is required and must be a string');
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Invalid email format');
  }

  return email.toLowerCase().trim();
};

/**
 * Validate phone number (basic validation)
 */
const validatePhone = (phone) => {
  if (!phone) return '';

  const phoneRegex = /^[\d\s\-+()]+$/;

  if (typeof phone !== 'string' || !phoneRegex.test(phone)) {
    throw new ApiError(400, 'Invalid phone number format');
  }

  return phone.trim();
};

module.exports = {
  validateAmount,
  validateQuantity,
  validatePercentage,
  validateOrderItems,
  validatePayment,
  validateDiscount,
  validateTaxRate,
  validateString,
  validateEmail,
  validatePhone,
};
