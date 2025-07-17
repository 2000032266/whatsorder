const fs = require('fs').promises;
const path = require('path');

/**
 * Menu Service - Handles menu operations
 */
class MenuService {
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
   * Get available menu items
   * @returns {Promise<Array>} Available menu items
   */
  async getAvailableItems() {
    try {
      const menu = await this.loadMenu();
      return menu.menu.filter(item => item.available);
    } catch (error) {
      console.error('Error getting available items:', error);
      return [];
    }
  }

  /**
   * Find menu item by ID
   * @param {number} itemId - Menu item ID
   * @returns {Promise<Object|null>} Menu item or null
   */
  async findItemById(itemId) {
    try {
      const menu = await this.loadMenu();
      return menu.menu.find(item => item.id === itemId && item.available) || null;
    } catch (error) {
      console.error('Error finding item by ID:', error);
      return null;
    }
  }

  /**
   * Search menu items by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching menu items
   */
  async searchItems(searchTerm) {
    try {
      const menu = await this.loadMenu();
      const term = searchTerm.toLowerCase();
      return menu.menu.filter(item => 
        item.available && 
        item.name.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  }

  /**
   * Format menu for display
   * @returns {Promise<string>} Formatted menu string
   */
  async formatMenuDisplay() {
    try {
      const menu = await this.loadMenu();
      
      if (!menu.menu || menu.menu.length === 0) {
        return "🚫 Sorry, no items are available today.";
      }

      let menuText = `🍽️ *${menu.restaurant_name} - Today's Menu*\n`;
      menuText += `📅 Date: ${menu.date}\n\n`;

      // Group items by category (show ALL items, not just available ones)
      const categories = {};
      menu.menu.forEach(item => {
        if (!categories[item.category]) {
          categories[item.category] = [];
        }
        categories[item.category].push(item);
      });

      // Format each category
      Object.keys(categories).forEach(category => {
        menuText += `*${category}* 🍴\n`;
        categories[category].forEach(item => {
          const status = item.available ? '✅' : '❌';
          menuText += `${item.emoji} *${item.id}. ${item.name}* - ₹${item.price} ${status}\n`;
          menuText += `   _${item.description}_\n\n`;
        });
      });

      menuText += "📱 *How to order:*\n";
      menuText += "Type: 'Order [quantity] [item name]'\n";
      menuText += "Example: 'Order 2 Chicken Biryani'\n\n";
      menuText += "💡 You can also use item numbers!\n";
      menuText += "Example: 'Order 1 item 1' or 'Order 2 #1'";

      return menuText;
    } catch (error) {
      console.error('Error formatting menu:', error);
      return "❌ Error loading menu. Please try again later.";
    }
  }

  /**
   * Get menu items by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Items in category
   */
  async getItemsByCategory(category) {
    try {
      const menu = await this.loadMenu();
      return menu.menu.filter(item => 
        item.available && 
        item.category.toLowerCase() === category.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting items by category:', error);
      return [];
    }
  }
}

module.exports = MenuService;
