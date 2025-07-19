const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || process.env.DATABASE_NAME,
  process.env.MYSQL_USER || process.env.DATABASE_USER,
  process.env.MYSQL_PASSWORD || process.env.DATABASE_PASSWORD,
  {
    host: process.env.MYSQL_HOST || process.env.DATABASE_HOST,
    port: process.env.MYSQL_PORT || process.env.DATABASE_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    }
  }
);

// Order Model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customerPhone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING(100),
    defaultValue: 'Customer'
  },
  items: {
    type: DataTypes.JSON, // MySQL JSON type
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'cod', 'failed'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cod', 'upi', 'card', 'bank_transfer', 'wallet'),
    defaultValue: 'cod'
  },
  paymentId: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  paymentLink: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  tableName: 'orders',
  timestamps: true, // This adds createdAt and updatedAt
  indexes: [
    {
      fields: ['customerPhone']
    },
    {
      fields: ['orderDate']
    },
    {
      fields: ['status']
    }
  ]
});

// Customer Model
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    defaultValue: 'Customer'
  },
  location: {
    type: DataTypes.STRING(255),
    defaultValue: null
  },
  currentLocation: {
    type: DataTypes.STRING(255),
    defaultValue: null
  },
  lastLocationUpdate: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  sessionActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastOrderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  preferredItems: {
    type: DataTypes.JSON, // Store as JSON
    defaultValue: []
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    {
      fields: ['phone']
    }
  ]
});

// Define associations
Customer.hasMany(Order, { foreignKey: 'customerPhone', sourceKey: 'phone' });
Order.belongsTo(Customer, { foreignKey: 'customerPhone', targetKey: 'phone' });

// Database connection and sync function
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database successfully');
    
    // Sync models with database (create tables if they don't exist)
    await sequelize.sync({ alter: true }); // Use { force: true } to drop and recreate tables
    console.log('✅ Database tables synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error);
    return false;
  }
}

// Close database connection
async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

// Export models and functions
module.exports = {
  sequelize,
  Order,
  Customer,
  connectDatabase,
  closeDatabase
};
