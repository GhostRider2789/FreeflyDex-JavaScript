const fs = require('fs').promises;
const path = require('path');

const DB_DIR = __dirname;
const ITEMS_FILE = path.join(DB_DIR, 'items.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Ensure files exist
async function init() {
    try {
        await fs.access(ITEMS_FILE);
    } catch {
        await fs.writeFile(ITEMS_FILE, JSON.stringify({ nextId: 1, items: [] }, null, 2));
    }
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify({}, null, 2));
    }
}

// Items
async function readItems() {
    const data = await fs.readFile(ITEMS_FILE, 'utf8');
    return JSON.parse(data);
}
async function writeItems(data) {
    await fs.writeFile(ITEMS_FILE, JSON.stringify(data, null, 2));
}

// Create new item with auto-incrementing id
async function createItem(name, type, rarity) {
    const db = await readItems();
    const id = db.nextId;
    const newItem = {
        id,
        name,
        type,
        rarity,
        createdAt: new Date().toISOString()
    };
    db.items.push(newItem);
    db.nextId = id + 1;
    await writeItems(db);
    return newItem;
}

// Get item by id
async function getItem(id) {
    const db = await readItems();
    return db.items.find(item => item.id === id);
}

// Get all items
async function getAllItems() {
    const data = await readItems();
    return data.items;
}

// Delete item
async function deleteItem(id) {
    const db = await readItems();
    const index = db.items.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    const deleted = db.items[index];
    db.items.splice(index, 1);
    await writeItems(db);
    return deleted;
}

// Users
async function readUsers() {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
}
async function writeUsers(data) {
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// Get or create user inventory
async function getUserInventory(userid) {
    const users = await readUsers();
    if (!users[userid]) {
        users[userId] = { items: [] };
    }
    return users[userid];
}

// Add an item to user's inventory
async function addItemToUser(userId, itemId, quantity = 1) {
    const users = await readUsers();
    if (!users[userId]) users[userId] = { items: [] };
    const user = users[userId];
    const existing = user.items.find(entry => entry.itemId === itemId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        user.items.push({ itemId, quantity });
    }
    await writeUsers(users);
}

// Initialize on require
init().catch(console.error);

module.exports = {
    createItem,
    getItem,
    getUserInventory,
    addItemToUser,
    deleteItem,
    getAllItems
};