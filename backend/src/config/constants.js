/**
 * ==============================================================================
 * StockSense Backend Constants
 * ==============================================================================
 * Hey team! Maintain all application-wide enums, movement types, operation statuses,
 * and user roles here. Using constants avoids typos across controllers and models.
 * ==============================================================================
 */

// Operation Types in Double-Entry Stock Operations
const OPERATION_TYPES = {
  RECEIPT: 'RECEIPT',       // Stock arriving from Vendor -> Internal Warehouse
  DELIVERY: 'DELIVERY',     // Stock departing Internal Warehouse -> Customer
  TRANSFER: 'TRANSFER',     // Stock moving Internal Warehouse A -> Internal Warehouse B
  ADJUSTMENT: 'ADJUSTMENT', // Physical inventory count correction
};

// Lifecycle Statuses for Operations
const OPERATION_STATUS = {
  DRAFT: 'draft',     // Saved as draft, stock balances unchanged
  READY: 'ready',     // Prepared for validation
  DONE: 'done',       // Validated & double-entry movements committed
  CANCELED: 'canceled' // Operation aborted
};

// User Roles & Access Control Levels
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  WORKER: 'worker',
};

module.exports = {
  OPERATION_TYPES,
  OPERATION_STATUS,
  USER_ROLES,
};
