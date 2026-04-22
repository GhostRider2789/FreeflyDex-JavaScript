const config = require('../config.json');

// Check if user is an admin (global admin ID or server role)
function isAdmin(member) {
    if (config.adminIds.includes(member.id)) return true;
    if (member.roles.cache.has(config.adminRoleId)) return true;
    return false;
}

// Check if user is bot owner (fussy goat)
function isOwner(userId) {
    return userId === config.ownerId;
}

module.exports = { isAdmin, isOwner };