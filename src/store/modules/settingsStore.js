import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db } from '../../db/db'

// Create a template cache for faster operations
let templateCache = {}
let pendingOperations = []
let isSyncing = false

export const useSettingsStore = defineStore('settings', () => {
  // State - using Composition API style
  const apiKey = ref('')
  const modelName = ref('gemini-1.5-flash')
  const systemPrompt = ref('')
  const temperature = ref(0.9)
  const topP = ref(1)
  const maxOutputTokens = ref(2048)
  const theme = ref('light')
  const maxHistoryItems = ref(50)
  const structuredOutput = ref(false)
  const outputSchema = ref('{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string"\n    }\n  }\n}')
  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null) // Track when the app was last updated
  
  // Template management
  const templates = ref([])
  const currentTemplateId = ref(null)
  const currentTemplateName = ref('')
  
  // Apply theme when it changes using watch
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })
  
  // Helper function to apply theme
  function applyTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  // Actions
  function setApiKey(key) {
    apiKey.value = key
    return saveSettingToDb('apiKey', key)
  }
  
  function setModelName(model) {
    modelName.value = model
    return saveSettingToDb('modelName', model)
  }
  
  function setSystemPrompt(prompt) {
    systemPrompt.value = prompt
    return saveSettingToDb('systemPrompt', prompt)
  }
  
  function setTemperature(temp) {
    temperature.value = parseFloat(temp)
    return saveSettingToDb('temperature', temp)
  }
  
  function setTopP(value) {
    topP.value = parseFloat(value)
    return saveSettingToDb('topP', value)
  }
  
  function setMaxOutputTokens(tokens) {
    maxOutputTokens.value = parseInt(tokens)
    return saveSettingToDb('maxOutputTokens', tokens)
  }
  
  function setTheme(newTheme) {
    theme.value = newTheme
    return saveSettingToDb('theme', newTheme)
  }
  
  function setMaxHistoryItems(max) {
    const value = parseInt(max) || 50
    maxHistoryItems.value = value
    return saveSettingToDb('maxHistoryItems', value)
  }
  
  function setStructuredOutput(value) {
    structuredOutput.value = value
    return saveSettingToDb('structuredOutput', value)
  }
  
  function setOutputSchema(schema) {
    outputSchema.value = schema
    return saveSettingToDb('outputSchema', schema)
  }
  
  // Set last updated timestamp
  function setLastUpdated(dateString) {
    lastUpdated.value = dateString
    return saveSettingToDb('lastUpdated', dateString)
  }
  
  // NEW OPTIMISTIC UI METHODS -----------------------------
  
  // Optimistically add a template to the UI before DB persistence
  function optimisticAddTemplate(template) {
    // Add to templates array for immediate UI update
    templates.value.push(template)
    
    // Cache the template
    templateCache[template.id] = template
    
    return template.id
  }
  
  // Optimistically update a template
  function optimisticUpdateTemplate(template) {
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index !== -1) {
      templates.value[index] = template
    }
    
    // Update cache
    templateCache[template.id] = template
    
    return template.id
  }
  
  // Update the ID of an optimistically added template with the real ID from DB
  function updateOptimisticTemplateId(tempId, realId) {
    const index = templates.value.findIndex(t => t.id === tempId)
    if (index !== -1) {
      const template = {...templates.value[index]}
      template.id = realId
      templates.value[index] = template
      
      // Update cache
      templateCache[realId] = template
      delete templateCache[tempId]
    }
  }
  
  // Revert an optimistic update if DB operation fails
  function revertOptimisticUpdate(id) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value.splice(index, 1)
    }
    
    // Remove from cache
    delete templateCache[id]
  }
  
  // Queue background operations and trigger sync
  function queueOperation(operation) {
    pendingOperations.push(operation)
    syncInBackground()
  }
  
  // Process pending operations in background
  async function syncInBackground() {
    if (isSyncing) return
    
    isSyncing = true
    
    try {
      while (pendingOperations.length > 0) {
        const operation = pendingOperations.shift()
        
        try {
          switch (operation.type) {
            case 'save':
              await _persistTemplate(operation.data)
              break
            case 'delete':
              await _persistDeleteTemplate(operation.data)
              break
            case 'update':
              await _persistUpdateTemplate(operation.data)
              break
          }
        } catch (err) {
          console.error(`Failed to process background operation: ${operation.type}`, err)
          // Re-add to queue if it's a transient error
          if (err.name !== 'QuotaExceededError' && err.name !== 'InvalidStateError') {
            pendingOperations.unshift(operation)
          }
          break // Pause processing and try again later
        }
      }
    } finally {
      isSyncing = false
      
      // If there are still operations, schedule another sync attempt
      if (pendingOperations.length > 0) {
        setTimeout(syncInBackground, 1000)
      }
    }
  }
  
  // Internal method to persist a template to DB
  async function _persistTemplate(data) {
    const { template, tempId } = data
    
    try {
      // Save to DB
      const templateId = await db.templates.add({
        name: template.name,
        config: template.config,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        isDefault: template.isDefault || false
      })
      
      // If we have a temporary ID, update it
      if (tempId && tempId !== templateId) {
        updateOptimisticTemplateId(tempId, templateId)
      }
      
      return templateId
    } catch (err) {
      console.error("Failed to persist template:", err)
      throw err
    }
  }
  
  // Internal method to persist a template deletion
  async function _persistDeleteTemplate(id) {
    try {
      await db.templates.delete(id)
    } catch (err) {
      console.error("Failed to persist template deletion:", err)
      throw err
    }
  }
  
  // Internal method to persist a template update
  async function _persistUpdateTemplate(data) {
    const { id, template } = data
    
    try {
      await db.templates.update(id, {
        name: template.name,
        config: template.config,
        updatedAt: new Date(),
        isDefault: template.isDefault || false
      })
    } catch (err) {
      console.error("Failed to persist template update:", err)
      throw err
    }
  }
  
  // Fast template saving with optimistic UI update
  function saveTemplateOptimistic(name, config, existingId = null) {
    // Clear any previous errors
    error.value = null
    
    // Validate template name only when actually attempting to save
    if (!name || name.trim() === '') {
      error.value = 'Template name is required'
      return null
    }
    
    try {
      // Use existing ID or generate a temporary one
      const tempId = existingId || `temp_${Date.now()}`
      
      // Create template object
      const template = {
        id: tempId,
        name,
        config,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false // We'll set this properly later
      }
      
      // Optimistically update UI
      if (existingId) {
        optimisticUpdateTemplate(template)
      } else {
        optimisticAddTemplate(template)
      }
      
      // Queue for background persistence
      queueOperation({
        type: 'save',
        data: { template, tempId }
      })
      
      return tempId
    } catch (err) {
      console.error("Failed to save template optimistically:", err)
      error.value = err.message || 'Failed to save template'
      return null
    }
  }
  
  // Fast template deletion with optimistic UI update
  function deleteTemplateOptimistic(templateId) {
    try {
      // First check if this is a default template
      const template = templates.value.find(t => t.id === templateId)
      
      // Prevent deletion of default templates
      if (template && template.isDefault) {
        console.error("Cannot delete default template")
        error.value = "Default templates cannot be deleted"
        return false
      }
      
      // Optimistically remove from UI
      const index = templates.value.findIndex(t => t.id === templateId)
      if (index !== -1) {
        templates.value.splice(index, 1)
      }
      
      // If we deleted the current template, clear current template and reset to default settings
      if (currentTemplateId.value === templateId.toString()) {
        // Set current template to null
        setCurrentTemplate(null)
        
        // Also reset to default settings
        resetToDefaultSettings()
      }
      
      // Queue for background persistence
      queueOperation({
        type: 'delete',
        data: templateId
      })
      
      return true
    } catch (err) {
      console.error("Failed to delete template optimistically:", err)
      error.value = err.message || 'Failed to delete template'
      return false
    }
  }
  
  // Reset to default settings when template is deleted
  async function resetToDefaultSettings() {
    try {
      // Look for a default template
      const defaultTemplate = templates.value.find(t => t.isDefault)
      
      if (defaultTemplate) {
        // Load the default template
        await loadTemplate(defaultTemplate.id)
        console.log('Switched to default template:', defaultTemplate.name)
      } else {
        // If no default template exists, set to application defaults
        modelName.value = 'gemini-1.5-flash'
        systemPrompt.value = ''
        temperature.value = 0.9
        topP.value = 1
        maxOutputTokens.value = 2048
        structuredOutput.value = false
        outputSchema.value = '{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string"\n    }\n  }\n}'
        
        // Save all settings to persist the defaults
        await saveAllSettings()
        console.log('Reset to application default settings')
      }
      
      return true
    } catch (err) {
      console.error("Failed to reset to default settings:", err)
      return false
    }
  }
  
  // Non-optimistic delete (regular)
  async function deleteTemplate(templateId) {
    try {
      // First check if this is a default template
      const template = await db.templates.get(templateId)
      
      // Prevent deletion of default templates
      if (template && template.isDefault) {
        console.error("Cannot delete default template")
        error.value = "Default templates cannot be deleted"
        return false
      }
      
      await db.templates.delete(templateId)
      
      // If we deleted the current template, clear current template and reset to default settings
      if (currentTemplateId.value === templateId.toString()) {
        await setCurrentTemplate(null)
        
        // Also reset to default settings
        await resetToDefaultSettings()
      }
      
      // Refresh templates list
      await loadTemplates()
      
      return true
    } catch (err) {
      console.error("Failed to delete template:", err)
      error.value = err.message || 'Failed to delete template'
      return false
    }
  }
  
  async function loadTemplates() {
    try {
      // Fast load from cache if available
      if (Object.keys(templateCache).length > 0 && templates.value.length > 0) {
        return templates.value
      }
      
      // Otherwise load from DB
      templates.value = await db.templates.toArray()
      
      // Update cache
      templateCache = {}
      templates.value.forEach(template => {
        templateCache[template.id] = template
      })
      
      // Load current template ID
      const currentTemplateIdSetting = await db.settings.get('currentTemplateId')
      if (currentTemplateIdSetting) {
        currentTemplateId.value = currentTemplateIdSetting.value
        
        // If we have a valid template ID, find its name
        if (currentTemplateId.value) {
          const template = templates.value.find(t => t.id === parseInt(currentTemplateId.value))
          if (template) {
            currentTemplateName.value = template.name
          } else {
            currentTemplateName.value = ''
          }
        }
      }
      
      return templates.value
    } catch (err) {
      console.error("Failed to load templates:", err)
      error.value = err.message || 'Failed to load templates'
      return []
    }
  }
  
  // New method - Save template with explicit config parameter and improved refresh logic
  async function saveTemplate(name, configValues) {
    if (!name) {
      error.value = 'Template name is required'
      return null
    }
    
    try {
      // Use the provided config values rather than reactive state
      const templateConfig = {
        modelName: configValues.modelName,
        systemPrompt: configValues.systemPrompt,
        temperature: configValues.temperature,
        topP: configValues.topP,
        maxOutputTokens: configValues.maxOutputTokens,
        structuredOutput: configValues.structuredOutput,
        outputSchema: configValues.outputSchema
      }
      
      // Check if template with this name already exists
      const existingTemplate = await db.templates.where('name').equals(name).first()
      
      let templateId
      if (existingTemplate) {
        // Update existing template
        templateId = existingTemplate.id
        await db.templates.update(templateId, {
          name,
          config: templateConfig,
          updatedAt: new Date(),
          // Maintain isDefault flag if it already exists
          isDefault: existingTemplate.isDefault || false
        })
      } else {
        // Check if this is going to be the first template
        const templatesCount = await db.templates.count()
        const isFirstTemplate = templatesCount === 0
        
        // Create new template
        templateId = await db.templates.add({
          name,
          config: templateConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: isFirstTemplate // Only set as default if it's the first template
        })
      }
      
      // Force a direct refresh of the templates list from database
      await loadTemplates()
      
      // Set current template
      await setCurrentTemplate(templateId)
      
      return templateId
    } catch (err) {
      console.error("Failed to save template:", err)
      error.value = err.message || 'Failed to save template'
      return null
    }
  }
  
  // Legacy method - use current state values
  async function saveAsTemplate(name) {
    if (!name) {
      error.value = 'Template name is required'
      return null
    }
    
    try {
      // Create template config object using current state
      const templateConfig = {
        modelName: modelName.value,
        systemPrompt: systemPrompt.value,
        temperature: temperature.value,
        topP: topP.value,
        maxOutputTokens: maxOutputTokens.value,
        structuredOutput: structuredOutput.value,
        outputSchema: outputSchema.value
      }
      
      // Check if template with this name already exists
      const existingTemplate = await db.templates.where('name').equals(name).first()
      
      let templateId
      if (existingTemplate) {
        // Update existing template
        templateId = existingTemplate.id
        await db.templates.update(templateId, {
          name,
          config: templateConfig,
          updatedAt: new Date(),
          // Maintain isDefault flag if it already exists
          isDefault: existingTemplate.isDefault || false
        })
      } else {
        // Check if this is going to be the first template
        const templatesCount = await db.templates.count()
        const isFirstTemplate = templatesCount === 0
        
        // Create new template
        templateId = await db.templates.add({
          name,
          config: templateConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: isFirstTemplate // Only set as default if it's the first template
        })
      }
      
      // Refresh templates list
      await loadTemplates()
      
      // Set current template
      await setCurrentTemplate(templateId)
      
      return templateId
    } catch (err) {
      console.error("Failed to save template:", err)
      error.value = err.message || 'Failed to save template'
      return null
    }
  }
  
  async function loadTemplate(templateId) {
    try {
      const template = await db.templates.get(templateId)
      
      if (!template) {
        throw new Error('Template not found')
      }
      
      // Apply template settings
      const config = template.config
      
      modelName.value = config.modelName
      systemPrompt.value = config.systemPrompt
      temperature.value = config.temperature
      topP.value = config.topP
      maxOutputTokens.value = config.maxOutputTokens
      structuredOutput.value = config.structuredOutput
      outputSchema.value = config.outputSchema
      
      // Save all settings to DB
      await saveAllSettings()
      
      // Set current template
      await setCurrentTemplate(templateId)
      
      return true
    } catch (err) {
      console.error("Failed to load template:", err)
      error.value = err.message || 'Failed to load template'
      return false
    }
  }
  
  async function setCurrentTemplate(templateId) {
    currentTemplateId.value = templateId
    
    // Update template name if we have a valid template
    if (templateId) {
      const template = templates.value.find(t => t.id === parseInt(templateId))
      currentTemplateName.value = template ? template.name : ''
    } else {
      currentTemplateName.value = ''
    }
    
    // Save current template ID to settings
    return saveSettingToDb('currentTemplateId', templateId)
  }
  
  // Database operations
  async function loadAllSettings() {
    isLoading.value = true
    error.value = null
    
    try {
      const storedSettings = await db.settings.toArray()
      
      storedSettings.forEach(item => {
        switch (item.key) {
          case 'apiKey':
            apiKey.value = item.value
            break
          case 'modelName':
            modelName.value = item.value
            break
          case 'systemPrompt':
            systemPrompt.value = item.value
            break
          case 'temperature':
            temperature.value = parseFloat(item.value)
            break
          case 'topP':
            topP.value = parseFloat(item.value)
            break
          case 'maxOutputTokens':
            maxOutputTokens.value = parseInt(item.value)
            break
          case 'theme':
            theme.value = item.value
            break
          case 'maxHistoryItems':
            maxHistoryItems.value = parseInt(item.value)
            break
          case 'structuredOutput':
            structuredOutput.value = item.value === 'true' || item.value === true
            break
          case 'outputSchema':
            outputSchema.value = item.value
            break
          case 'currentTemplateId':
            currentTemplateId.value = item.value
            break
          case 'lastUpdated':
            lastUpdated.value = item.value
            break
        }
      })
      
      // Initialize missing settings
      await initializeDefaultSettings()
      
      // Load templates
      await loadTemplates()
      
      // Fix any duplicate default templates
      await ensureSingleDefaultTemplate()
      
      return true
    } catch (err) {
      console.error("Failed to load settings:", err)
      error.value = err.message || 'Failed to load settings'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  async function saveSettingToDb(key, value) {
    try {
      await db.settings.put({ key, value })
      return true
    } catch (err) {
      console.error(`Failed to save setting ${key}:`, err)
      error.value = err.message || `Failed to save setting ${key}`
      return false
    }
  }
  
  async function saveAllSettings() {
    isLoading.value = true
    error.value = null
    
    try {
      const settingsToSave = [
        { key: 'apiKey', value: apiKey.value },
        { key: 'modelName', value: modelName.value },
        { key: 'systemPrompt', value: systemPrompt.value },
        { key: 'temperature', value: temperature.value },
        { key: 'topP', value: topP.value },
        { key: 'maxOutputTokens', value: maxOutputTokens.value },
        { key: 'theme', value: theme.value },
        { key: 'maxHistoryItems', value: maxHistoryItems.value },
        { key: 'structuredOutput', value: structuredOutput.value },
        { key: 'outputSchema', value: outputSchema.value },
        { key: 'currentTemplateId', value: currentTemplateId.value },
        { key: 'lastUpdated', value: lastUpdated.value }
      ]
      
      await db.settings.bulkPut(settingsToSave)
      return true
    } catch (err) {
      console.error("Failed to save all settings:", err)
      error.value = err.message || 'Failed to save settings'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Initialize default settings if they don't exist
  async function initializeDefaultSettings() {
    const defaultSettings = {
      apiKey: apiKey.value || '',
      modelName: modelName.value || 'gemini-1.5-flash',
      systemPrompt: systemPrompt.value || '',
      temperature: temperature.value !== undefined ? temperature.value : 0.9,
      topP: topP.value !== undefined ? topP.value : 1,
      maxOutputTokens: maxOutputTokens.value !== undefined ? maxOutputTokens.value : 2048,
      theme: theme.value || 'light',
      maxHistoryItems: maxHistoryItems.value || 50,
      structuredOutput: structuredOutput.value !== undefined ? structuredOutput.value : false,
      outputSchema: outputSchema.value || '{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string"\n    }\n  }\n}',
      currentTemplateId: currentTemplateId.value || null,
      lastUpdated: lastUpdated.value || new Date().toISOString() // Initialize with current date if not set
    }

    for (const [key, value] of Object.entries(defaultSettings)) {
      const existing = await db.settings.get(key)
      if (!existing) {
        await db.settings.put({ key, value })
      }
    }
    
    // Create default template if no templates exist
    await createDefaultTemplateIfNeeded()
  }
  
  // Create a default template if none exists
  async function createDefaultTemplateIfNeeded() {
    try {
      const templatesCount = await db.templates.count()
      
      if (templatesCount === 0) {
        // Define default template configuration
        const defaultTemplateConfig = {
          modelName: 'gemini-1.5-flash',
          systemPrompt: '',
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048,
          structuredOutput: false,
          outputSchema: '{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string"\n    }\n  }\n}'
        }
        
        // Add default template to database
        const defaultTemplateId = await db.templates.add({
          name: 'PromptBox Chat',
          config: defaultTemplateConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: true
        })
        
        // Set as current template
        await setCurrentTemplate(defaultTemplateId)
        
        console.log('Created default template with ID:', defaultTemplateId)
        return defaultTemplateId
      }
      
      return null
    } catch (err) {
      console.error("Failed to create default template:", err)
      error.value = err.message || 'Failed to create default template'
      return null
    }
  }
  
  // Function to ensure only one template is marked as default
  async function ensureSingleDefaultTemplate() {
    try {
      // Get all templates from the database
      const allTemplates = await db.templates.toArray();
      
      // Find templates with isDefault = true 
      const defaultTemplates = allTemplates.filter(template => template.isDefault === true);
      
      // If there are multiple default templates, fix the issue
      if (defaultTemplates.length > 1) {
        
        // Keep only the first one as default
        for (let i = 1; i < defaultTemplates.length; i++) {
          await db.templates.update(defaultTemplates[i].id, { isDefault: false });
        }
        
        // If no templates are marked as default, set the first one
      } else if (defaultTemplates.length === 0 && allTemplates.length > 0) {
        await db.templates.update(allTemplates[0].id, { isDefault: true });
      }
      
      // Refresh templates list to reflect changes
      await loadTemplates();
      
      return true;
    } catch (err) {
      console.error("Failed to fix default templates:", err);
      return false;
    }
  }
  
  // Initialize settings
  function initializeSettings() {
    // Load settings from database
    loadAllSettings()
    
    // Apply saved theme on load
    applyTheme(theme.value)
  }
  
  // Get model generation config
  function getModelConfig() {
    return {
      temperature: temperature.value,
      topP: topP.value,
      maxOutputTokens: maxOutputTokens.value
    }
  }
  
  // Get structured output configuration
  function getStructuredOutputConfig() {
    if (!structuredOutput.value) return null
    
    try {
      // Parse and validate JSON schema
      const schema = JSON.parse(outputSchema.value)
      return { schema }
    } catch (err) {
      console.error("Invalid output schema JSON:", err)
      return null
    }
  }
  
  return {
    // State
    apiKey,
    modelName,
    systemPrompt,
    temperature,
    topP,
    maxOutputTokens,
    theme,
    maxHistoryItems,
    structuredOutput,
    outputSchema,
    isLoading,
    error,
    lastUpdated,
    
    // Template state
    templates,
    currentTemplateId,
    currentTemplateName,
    
    // Getters
    getModelConfig,
    getStructuredOutputConfig,
    
    // Actions
    setApiKey,
    setModelName,
    setSystemPrompt,
    setTemperature,
    setTopP,
    setMaxOutputTokens,
    setTheme,
    setMaxHistoryItems,
    setStructuredOutput,
    setOutputSchema,
    setLastUpdated,
    loadAllSettings,
    saveSettingToDb,
    saveAllSettings,
    initializeSettings,
    resetToDefaultSettings,
    
    // Template management
    loadTemplates,
    saveTemplate,
    saveAsTemplate,
    loadTemplate,
    deleteTemplate,
    setCurrentTemplate,
    ensureSingleDefaultTemplate,
    
    // New optimistic methods
    optimisticAddTemplate,
    optimisticUpdateTemplate,
    updateOptimisticTemplateId,
    revertOptimisticUpdate,
    saveTemplateOptimistic,
    deleteTemplateOptimistic,
    queueOperation,
    syncInBackground
  }
}, {
  // Persistence configuration
  persist: {
    key: 'promptbox-settings',
    storage: localStorage,
    paths: [
      'apiKey', 
      'modelName', 
      'systemPrompt',
      'temperature',
      'topP',
      'maxOutputTokens',
      'theme', 
      'maxHistoryItems',
      'structuredOutput',
      'outputSchema',
      'currentTemplateId',
      'lastUpdated'
    ]
  }
})