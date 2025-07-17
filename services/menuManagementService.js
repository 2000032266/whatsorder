const fs = require('fs').promises;
const path = require('path');

/**
 * Menu Management Service - Handles menu CRUD operations for restaurant owner
 */
class MenuManagementService {
  constructor() {
    this.menuFilePath = path.join(__dirname, '..', 'menu.json');
  }

  /**
   * Load menu from JSON file
   * @returns {Promise<Object>} Menu data
   */
  async loadMenu() {
    try {
      const menuData = await fs.readFile(this.menuFilePath, 'utf8');
      return JSON.parse(menuData);
    } catch (error) {
      console.error('Error loading menu:', error);
      throw new Error('Failed to load menu');
    }
  }

  /**
   * Save menu to JSON file
   * @param {Object} menuData - Menu data to save
   * @returns {Promise<boolean>} Success status
   */
  async saveMenu(menuData) {
    try {
      await fs.writeFile(this.menuFilePath, JSON.stringify(menuData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving menu:', error);
      return false;
    }
  }

  /**
   * Add new menu item
   * @param {string} name - Item name
   * @param {number} price - Item price in INR
   * @param {string} description - Item description (optional)
   * @param {string} category - Item category (optional)
   * @returns {Promise<Object>} Result with success status and new item
   */
  async addMenuItem(name, price, description = '', category = 'Main Course') {
    try {
      const menuData = await this.loadMenu();
      
      // Check if item already exists
      const existingItem = menuData.menu.find(item => 
        item.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingItem) {
        return {
          success: false,
          message: `Item "${name}" already exists in the menu`,
          item: existingItem
        };
      }

      // Generate new ID
      const maxId = menuData.menu.reduce((max, item) => Math.max(max, item.id), 0);
      const newId = maxId + 1;

      // Convert price to INR (assuming input is in INR)
      const priceInINR = parseFloat(price);
      
      // Auto-assign emoji based on category or name
      const emoji = this.getEmojiForItem(name, category);

      const newItem = {
        id: newId,
        name: name.trim(),
        description: description.trim() || `Delicious ${name}`,
        price: priceInINR,
        category: category.trim(),
        available: true,
        emoji: emoji
      };

      menuData.menu.push(newItem);
      menuData.date = new Date().toISOString().split('T')[0]; // Update date

      const saved = await this.saveMenu(menuData);
      
      if (saved) {
        return {
          success: true,
          message: `✅ "${name}" added to menu successfully!`,
          item: newItem
        };
      } else {
        return {
          success: false,
          message: 'Failed to save menu changes'
        };
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      return {
        success: false,
        message: 'Error adding menu item'
      };
    }
  }

  /**
   * Edit existing menu item
   * @param {string|number} identifier - Item ID or name
   * @param {Object} updates - Updates to apply (name, price, description, category, available)
   * @returns {Promise<Object>} Result with success status
   */
  async editMenuItem(identifier, updates) {
    try {
      const menuData = await this.loadMenu();
      
      // Find item by ID or name
      let itemIndex = -1;
      if (typeof identifier === 'number' || !isNaN(identifier)) {
        itemIndex = menuData.menu.findIndex(item => item.id === parseInt(identifier));
      } else {
        itemIndex = menuData.menu.findIndex(item => 
          item.name.toLowerCase() === identifier.toLowerCase()
        );
      }

      if (itemIndex === -1) {
        return {
          success: false,
          message: `Item "${identifier}" not found in menu`
        };
      }

      const originalItem = { ...menuData.menu[itemIndex] };
      
      // Apply updates
      if (updates.name) {
        // Check if new name conflicts with existing items
        const conflictItem = menuData.menu.find((item, index) => 
          index !== itemIndex && item.name.toLowerCase() === updates.name.toLowerCase()
        );
        if (conflictItem) {
          return {
            success: false,
            message: `Name "${updates.name}" already exists in menu`
          };
        }
        menuData.menu[itemIndex].name = updates.name.trim();
      }
      
      if (updates.price !== undefined) {
        menuData.menu[itemIndex].price = parseFloat(updates.price);
      }
      
      if (updates.description) {
        menuData.menu[itemIndex].description = updates.description.trim();
      }
      
      if (updates.category) {
        menuData.menu[itemIndex].category = updates.category.trim();
      }
      
      if (updates.available !== undefined) {
        menuData.menu[itemIndex].available = Boolean(updates.available);
      }

      // Update emoji if name or category changed
      if (updates.name || updates.category) {
        menuData.menu[itemIndex].emoji = this.getEmojiForItem(
          menuData.menu[itemIndex].name, 
          menuData.menu[itemIndex].category
        );
      }

      menuData.date = new Date().toISOString().split('T')[0];

      const saved = await this.saveMenu(menuData);
      
      if (saved) {
        return {
          success: true,
          message: `✅ "${originalItem.name}" updated successfully!`,
          oldItem: originalItem,
          newItem: menuData.menu[itemIndex]
        };
      } else {
        return {
          success: false,
          message: 'Failed to save menu changes'
        };
      }
    } catch (error) {
      console.error('Error editing menu item:', error);
      return {
        success: false,
        message: 'Error editing menu item'
      };
    }
  }

  /**
   * Delete menu item
   * @param {string|number} identifier - Item ID or name
   * @returns {Promise<Object>} Result with success status
   */
  async deleteMenuItem(identifier) {
    try {
      const menuData = await this.loadMenu();
      
      // Find item by ID or name
      let itemIndex = -1;
      if (typeof identifier === 'number' || !isNaN(identifier)) {
        itemIndex = menuData.menu.findIndex(item => item.id === parseInt(identifier));
      } else {
        itemIndex = menuData.menu.findIndex(item => 
          item.name.toLowerCase() === identifier.toLowerCase()
        );
      }

      if (itemIndex === -1) {
        return {
          success: false,
          message: `Item "${identifier}" not found in menu`
        };
      }

      const deletedItem = menuData.menu[itemIndex];
      menuData.menu.splice(itemIndex, 1);
      menuData.date = new Date().toISOString().split('T')[0];

      const saved = await this.saveMenu(menuData);
      
      if (saved) {
        return {
          success: true,
          message: `✅ "${deletedItem.name}" deleted from menu successfully!`,
          deletedItem: deletedItem
        };
      } else {
        return {
          success: false,
          message: 'Failed to save menu changes'
        };
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return {
        success: false,
        message: 'Error deleting menu item'
      };
    }
  }

  /**
   * Get menu items list for management
   * @returns {Promise<Object>} Menu items with management info
   */
  async getMenuForManagement() {
    try {
      const menuData = await this.loadMenu();
      return {
        success: true,
        restaurantName: menuData.restaurant_name,
        lastUpdated: menuData.date,
        totalItems: menuData.menu.length,
        availableItems: menuData.menu.filter(item => item.available).length,
        items: menuData.menu.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          available: item.available,
          emoji: item.emoji
        }))
      };
    } catch (error) {
      console.error('Error getting menu for management:', error);
      return {
        success: false,
        message: 'Error loading menu'
      };
    }
  }

  /**
   * Toggle item availability
   * @param {string|number} identifier - Item ID or name
   * @returns {Promise<Object>} Result with success status
   */
  async toggleItemAvailability(identifier) {
    try {
      const menuData = await this.loadMenu();
      
      let itemIndex = -1;
      if (typeof identifier === 'number' || !isNaN(identifier)) {
        itemIndex = menuData.menu.findIndex(item => item.id === parseInt(identifier));
      } else {
        itemIndex = menuData.menu.findIndex(item => 
          item.name.toLowerCase() === identifier.toLowerCase()
        );
      }

      if (itemIndex === -1) {
        return {
          success: false,
          message: `Item "${identifier}" not found in menu`
        };
      }

      const item = menuData.menu[itemIndex];
      item.available = !item.available;
      menuData.date = new Date().toISOString().split('T')[0];

      const saved = await this.saveMenu(menuData);
      
      if (saved) {
        const status = item.available ? 'available' : 'unavailable';
        return {
          success: true,
          message: `✅ "${item.name}" marked as ${status}`,
          item: item
        };
      } else {
        return {
          success: false,
          message: 'Failed to save menu changes'
        };
      }
    } catch (error) {
      console.error('Error toggling item availability:', error);
      return {
        success: false,
        message: 'Error updating item availability'
      };
    }
  }

  /**
   * Get emoji for menu item based on name and category
   * @param {string} name - Item name
   * @param {string} category - Item category
   * @returns {string} Appropriate emoji
   */
  getEmojiForItem(name, category) {
    const nameLower = name.toLowerCase();
    const categoryLower = category.toLowerCase();

    // Food-specific emojis
    if (nameLower.includes('biryani') || nameLower.includes('rice')) return '🍛';
    if (nameLower.includes('chicken') && nameLower.includes('tikka')) return '🍗';
    if (nameLower.includes('chicken')) return '🐔';
    if (nameLower.includes('mutton') || nameLower.includes('lamb')) return '🍖';
    if (nameLower.includes('fish')) return '🐟';
    if (nameLower.includes('curry')) return '🍛';
    if (nameLower.includes('naan') || nameLower.includes('bread')) return '🫓';
    if (nameLower.includes('lassi') || nameLower.includes('drink')) return '🥤';
    if (nameLower.includes('tea') || nameLower.includes('chai')) return '🍵';
    if (nameLower.includes('coffee')) return '☕';
    if (nameLower.includes('dessert') || nameLower.includes('sweet')) return '🍮';
    if (nameLower.includes('ice cream')) return '🍦';
    if (nameLower.includes('pizza')) return '🍕';
    if (nameLower.includes('burger')) return '🍔';
    if (nameLower.includes('sandwich')) return '🥪';
    if (nameLower.includes('salad')) return '🥗';
    if (nameLower.includes('soup')) return '🍲';

    // Category-based emojis
    if (categoryLower.includes('appetizer') || categoryLower.includes('starter')) return '🍽️';
    if (categoryLower.includes('main') || categoryLower.includes('course')) return '🍛';
    if (categoryLower.includes('dessert') || categoryLower.includes('sweet')) return '🍮';
    if (categoryLower.includes('drink') || categoryLower.includes('beverage')) return '🥤';
    if (categoryLower.includes('bread') || categoryLower.includes('roti')) return '🫓';

    // Default emoji
    return '🍽️';
  }
}

module.exports = MenuManagementService;
