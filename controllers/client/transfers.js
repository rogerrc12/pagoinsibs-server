const db = require('../../config/db');

module.exports = {
  getTransfers: async user => {
    return await db('users_transfers as ut').select([
      'ut.*', 'u.cedula', 'u.pay_id', 'u.first_name', 'u.last_name'
    ])
    .join('users as u', { 'ut.user_received_id': 'u.id' })
    .where({ user_id: user.id });
  }
}