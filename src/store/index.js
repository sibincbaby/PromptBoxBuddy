/**
 * Central store index file
 * - Exports all stores from store modules for easy importing throughout the app
 * - No longer creates a duplicate Pinia instance
 */

// Export all stores from modules for easy importing
export * from './modules/promptStore'
export * from './modules/historyStore'
export * from './modules/settingsStore'